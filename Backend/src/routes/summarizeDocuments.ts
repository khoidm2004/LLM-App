import { Router } from "express";
import { ChatGroq } from "@langchain/groq";
import {
  getSupabaseClient,
  MEETING_DOCUMENTS_BUCKET,
} from "../lib/supabaseClient";
import { getSessionByToken, touchSession } from "../lib/uploadSessions";
import { extractText, TextExtractionError } from "../lib/textExtraction";
import { isMeetingContent } from "../lib/isMeetingContent";
import {
  buildDocumentSummaryPrompt,
  SUMMARY_LENGTHS,
  type SummaryLength,
} from "../lib/documentSummaryPrompt";

// Same model as the chat-paste summarizer (server.ts): confirmed available
// on this Groq account and has a large enough context window for up to 3
// concatenated documents. (llama-3.3-70b-versatile returned a 404
// model_not_found on this account when verified against production.)
const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  apiKey: process.env.GROQ_API_KEY!,
});

// Caps the text actually sent to the main summarization prompt. Without
// this, a long irrelevant upload (which has already been rejected by
// isMeetingContent in the normal case, but this also guards genuinely long
// meeting documents) could approach the model's context limit and turn
// into a slow, opaque failure instead of a clean response.
const MAX_DOCUMENT_CHARS = 50_000;

const NOT_MEETING_CONTENT_MESSAGE =
  "<u>The uploaded documents do not appear to contain meeting minutes. Please upload documents containing discussions, decisions, or action items.</u>";

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

    // Fast relevance check before the slow, detailed summarization call —
    // a non-meeting upload gets rejected in roughly the time of one short
    // LLM call instead of waiting through a full generation (which, for a
    // long irrelevant document, could also hit the model's context limit
    // and fail with an opaque error instead of ever returning a rejection).
    if (!(await isMeetingContent(documentText))) {
      res.status(400).json({ error: NOT_MEETING_CONTENT_MESSAGE });
      return;
    }

    const truncatedDocumentText =
      documentText.length > MAX_DOCUMENT_CHARS
        ? documentText.slice(0, MAX_DOCUMENT_CHARS) +
          "\n\n[... truncated: the combined documents were too long to process in full ...]"
        : documentText;

    let summaryContent: string;
    try {
      const prompt = buildDocumentSummaryPrompt(length);
      const chain = prompt.pipe(model);
      const result = await chain.invoke({ documentText: truncatedDocumentText });
      summaryContent = String(result.content);
    } catch (groqError) {
      console.error("Groq summarization call failed:", groqError);
      res.status(502).json({
        error:
          "The AI summarization service couldn't process this document. Try again, or upload a shorter document.",
        details: groqError instanceof Error ? groqError.message : "Unknown error",
      });
      return;
    }

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
