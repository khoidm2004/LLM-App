import { PromptTemplate } from "@langchain/core/prompts";

export const SUMMARY_LENGTHS = ["short", "medium", "detailed"] as const;
export type SummaryLength = (typeof SUMMARY_LENGTHS)[number];

const LENGTH_INSTRUCTIONS: Record<SummaryLength, string> = {
  short:
    "Keep it brief: 1-2 sentences for the overview, and only the 2-4 most important bullet points per section.",
  medium:
    "Use a moderate level of detail: a short paragraph for the overview, and enough bullet points per section to cover all notable items without padding.",
  detailed:
    "Be thorough: a full paragraph for the overview, and cover every discussion point, decision, and action item found in the source text, including minor ones.",
};

// Builds the prompt for summarizing text extracted from uploaded meeting
// documents (as opposed to pasted meeting-minutes text, which uses the
// prompt in server.ts). Reuses the same highlight conventions the chat UI
// already knows how to render: bold headers, underlined notes, bold+
// underlined names, and a markdown table for action items.
export const buildDocumentSummaryPrompt = (length: SummaryLength) =>
  PromptTemplate.fromTemplate(`
You are a professional meeting summarizer with validation capabilities. The
text below was extracted from one or more uploaded meeting documents (PDF,
DOC, DOCX, or TXT), so it may contain minor formatting artifacts from that
conversion — ignore those and focus on the content.

FIRST, analyze if the provided text is actually meeting minutes or meeting-related content.

Meeting minutes typically contain:
- Discussion of topics or agenda items
- Decisions made or conclusions reached
- Action items or tasks assigned
- Participant information or attendees
- Date/time information
- Topics discussed in a professional context

If the text is NOT meeting minutes (e.g., random text, stories, code, personal documents, advertisements, etc.), respond EXACTLY with this format (keep the underline tags, since this is an important note to the user):
<u>The uploaded documents do not appear to contain meeting minutes. Please upload documents containing discussions, decisions, or action items.</u>

If the text IS valid meeting minutes, provide a structured summary in the following format:

1. MEETING OVERVIEW: A short overview of the meeting
2. KEY DISCUSSION POINTS: List the key topics discussed
3. DECISIONS MADE: List the main decisions made
4. ACTION ITEMS: Present every action item as a markdown table with exactly these columns: Action Item | Owner | Deadline. Use standard markdown table syntax (a header row, then a |---|---|---| separator row, then one row per action item). If an owner or deadline isn't mentioned, write "TBD" in that cell.

Length guidance: ${LENGTH_INSTRUCTIONS[length]}

Apply the following highlight rules consistently throughout the summary:
- Each of the 4 section headers above must be bold. Example: **1. MEETING OVERVIEW:**
- Any important note, warning, risk, or caveat must be underlined. Example: <u>This deadline is at risk of slipping.</u>
- Every mention of a person's name must be both bold AND underlined. Example: <u>**Jane Doe**</u>
- Inside the ACTION ITEMS table, the Owner cell must still follow the bold+underlined name rule, e.g. | Finalize budget | <u>**Jane Doe**</u> | 2026-12-01 |

Extracted document text to analyze:
{documentText}

Remember: If not meeting minutes, return the underlined rejection message. If valid, provide the structured summary.
`);
