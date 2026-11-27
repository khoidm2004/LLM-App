import { Router } from "express";
import { ChatGroq } from "@langchain/groq";
import {
  getSupabaseClient,
  MEETING_DOCUMENTS_BUCKET,
} from "../lib/supabaseClient";
import { getSessionByToken, touchSession } from "../lib/uploadSessions";
import { extractText, TextExtractionError } from "../lib/textExtraction";
import {
  buildDocumentSummaryPrompt,
  SUMMARY_LENGTHS,
  type SummaryLength,
} from "../lib/documentSummaryPrompt";

// Larger context window than the chat-paste summarizer, since this handles
// up to 3 concatenated documents instead of one pasted block of text.
const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY!,
});

const isSummaryLength = (value: unknown): value is SummaryLength =>
  typeof value === "string" &&
  (SUMMARY_LENGTHS as readonly string[]).includes(value);

const router: Router = Router();

router.post("/api/summarize-documents", async (req, res) => {
  try {
    const sessionToken = (req.body.sessionToken as string | undefined)?.trim();
    const length = req.body.length as unknown;

    if (!sessionToken) {
      res.status(400).json({ error: "sessionToken is required." });
      return;
    }
    if (!isSummaryLength(length)) {
      res.status(400).json({
        error: `length must be one of: ${SUMMARY_LENGTHS.join(", ")}.`,
      });
      return;
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      res
        .status(404)
        .json({ error: "Unknown session. Upload files first." });
      return;
    }
    await touchSession(sessionToken);

    const supabase = getSupabaseClient();
    const { data: files, error: filesError } = await supabase
      .from("uploaded_files")
      .select()
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    if (filesError) {
      throw new Error(`Failed to list uploaded files: ${filesError.message}`);
    }
    if (!files || files.length === 0) {
      res
        .status(400)
        .json({ error: "No files uploaded for this session yet." });
      return;
    }

    const documentSections: string[] = [];
    for (const file of files) {
      const { data: blob, error: downloadError } = await supabase.storage
        .from(MEETING_DOCUMENTS_BUCKET)
        .download(file.storage_path);

      if (downloadError || !blob) {
        throw new Error(
          `Failed to download "${file.original_filename}": ${downloadError?.message ?? "no data returned"}`,
        );
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      const text = await extractText(file.original_filename, buffer);
      documentSections.push(`--- ${file.original_filename} ---\n${text}`);
    }

    const documentText = documentSections.join("\n\n");
    const prompt = buildDocumentSummaryPrompt(length);
    const chain = prompt.pipe(model);
    const result = await chain.invoke({ documentText });
    const summaryContent = String(result.content);

    const { data: summaryRow, error: summaryError } = await supabase
      .from("summaries")
      .insert({ session_id: session.id, length, content: summaryContent })
      .select()
      .single();

    if (summaryError || !summaryRow) {
      throw new Error(
        `Failed to store summary: ${summaryError?.message ?? "no row returned"}`,
      );
    }

    res.json({ summaryId: summaryRow.id, summary: summaryContent });
  } catch (error) {
    if (error instanceof TextExtractionError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error("Summarize-documents error:", error);
    res.status(500).json({
      error: "Failed to generate summary",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Fetches the most recent stored summary for a session. Counts as "view"
// activity, bumping last_activity_at the same as upload/summarize do.
router.get("/api/sessions/:sessionToken/summary", async (req, res) => {
  try {
    const sessionToken = req.params.sessionToken;
    if (!sessionToken) {
      res.status(400).json({ error: "sessionToken is required." });
      return;
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      res.status(404).json({ error: "Unknown session." });
      return;
    }
    await touchSession(sessionToken);

    const supabase = getSupabaseClient();
    const { data: summary, error } = await supabase
      .from("summaries")
      .select()
      .eq("session_id", session.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch summary: ${error.message}`);
    }
    if (!summary) {
      res
        .status(404)
        .json({ error: "No summary generated yet for this session." });
      return;
    }

    res.json({
      summaryId: summary.id,
      summary: summary.content,
      length: summary.length,
    });
  } catch (error) {
    console.error("Get summary error:", error);
    res.status(500).json({
      error: "Failed to fetch summary",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
