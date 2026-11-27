import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";

// Only the first few thousand characters are needed to tell whether a
// document is meeting-related — real meeting minutes reveal that in their
// opening (date, attendees, agenda). Capping the sample keeps this check
// fast and cheap regardless of how long the full document is.
const SAMPLE_CHARS = 4000;

// openai/gpt-oss-120b is a reasoning model: it can spend part of its token
// budget on hidden reasoning before the visible answer. 20 tokens leaves
// room for that plus YES/NO, while still being far smaller (and faster)
// than a full multi-section summary.
const classifierModel = new ChatGroq({
  model: "openai/gpt-oss-120b",
  apiKey: process.env.GROQ_API_KEY!,
  maxTokens: 20,
});

const classifierPrompt = PromptTemplate.fromTemplate(`
Does the following text contain meeting minutes or meeting-related content — discussion of topics, decisions made, action items, attendees, or date/time information from a professional meeting?

Answer with exactly one word, YES or NO. Do not explain.

Text:
{sample}
`);

// Fast relevance check run BEFORE the slow, detailed summarization call, so
// a non-meeting upload gets rejected quickly instead of waiting through a
// full generation that might also blow past the model's context limit for
// a long irrelevant document. Fails open (treats the content as meeting
// content) if the classifier call itself errors, so a transient classifier
// hiccup can't block a legitimate upload — the main prompt's own "is this
// meeting minutes" check still runs as a fallback either way.
export const isMeetingContent = async (documentText: string): Promise<boolean> => {
  const sample = documentText.slice(0, SAMPLE_CHARS);
  try {
    const chain = classifierPrompt.pipe(classifierModel);
    const result = await chain.invoke({ sample });
    const answer = String(result.content).trim().toUpperCase();
    // Default to true (let it through) unless the model clearly answered NO,
    // so an empty/unparseable answer doesn't wrongly reject real content.
    return !answer.startsWith("N");
  } catch (error) {
    console.error("Meeting-content classifier error, failing open:", error);
    return true;
  }
};
