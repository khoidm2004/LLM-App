import Groq from "groq-sdk";

// Only the first few thousand characters are needed to tell whether a
// document is meeting-related — real meeting minutes reveal that in their
// opening (date, attendees, agenda). Capping the sample keeps this check
// fast and cheap regardless of how long the full document is.
const SAMPLE_CHARS = 4000;

let client: Groq | null = null;
const getClient = (): Groq => {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  return client;
};

// Fast relevance check run BEFORE the slow, detailed summarization call, so
// a non-meeting upload gets rejected quickly instead of waiting through a
// full generation that might also blow past the model's context limit for
// a long irrelevant document.
//
// Uses the Groq SDK directly rather than the LangChain wrapper: this needs
// reasoning_format: "hidden" (openai/gpt-oss-120b is a reasoning model that
// otherwise spends its whole token budget on hidden reasoning before ever
// emitting YES/NO — confirmed against production, the first version of this
// check silently never returned false). That's a per-call API parameter,
// and the installed @langchain/groq version exposes no supported way to
// attach it to a prompt|model chain.
//
// Fails open (treats the content as meeting content) if the call itself
// errors, so a transient hiccup can't block a legitimate upload — the main
// prompt's own "is this meeting minutes" check still runs as a fallback.
export const isMeetingContent = async (documentText: string): Promise<boolean> => {
  const sample = documentText.slice(0, SAMPLE_CHARS);
  try {
    const response = await getClient().chat.completions.create({
      model: "openai/gpt-oss-120b",
      max_tokens: 20,
      // gpt-oss models can't disable reasoning entirely (no "none" support,
      // unlike qwen3 — "low" is the minimum), so pair the lowest effort
      // with "hidden" formatting to keep this check fast.
      reasoning_effort: "low",
      reasoning_format: "hidden",
      messages: [
        {
          role: "user",
          content:
            "Does the following text contain meeting minutes or meeting-related content — " +
            "discussion of topics, decisions made, action items, attendees, or date/time " +
            "information from a professional meeting?\n\n" +
            "Answer with exactly one word, YES or NO. Do not explain.\n\n" +
            `Text:\n${sample}`,
        },
      ],
    });
    const answer = (response.choices[0]?.message?.content ?? "").trim().toUpperCase();
    // Default to true (let it through) unless the model clearly answered NO,
    // so an empty/unparseable answer doesn't wrongly reject real content.
    return !answer.startsWith("N");
  } catch (error) {
    console.error("Meeting-content classifier error, failing open:", error);
    return true;
  }
};
