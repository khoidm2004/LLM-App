import { Bot, User, Copy, Check } from "lucide-react";
import { useState, type ReactNode } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

// Parses **bold** and <u>underline</u> markers from the AI response into
// real React elements (no HTML injection), supporting nesting like <u>**Name**</u>.
// Matches don't cross a blank line, so a marker left unclosed in one paragraph
// can't swallow unrelated later paragraphs looking for its closing pair.
const parseFormattedText = (text: string, keyPrefix = "root"): ReactNode[] => {
  const boldMatch = text.match(/\*\*((?:(?!\n\n)[\s\S])+?)\*\*/);
  const underlineMatch = text.match(/<u>((?:(?!\n\n)[\s\S])+?)<\/u>/);

  let match: RegExpMatchArray | null = null;
  let isBold = false;

  if (boldMatch && underlineMatch) {
    isBold = boldMatch.index! <= underlineMatch.index!;
    match = isBold ? boldMatch : underlineMatch;
  } else if (boldMatch) {
    match = boldMatch;
    isBold = true;
  } else if (underlineMatch) {
    match = underlineMatch;
    isBold = false;
  }

  if (!match || match.index === undefined) {
    return [text];
  }

  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  const innerNodes = parseFormattedText(match[1], `${keyPrefix}-i`);

  const nodes: ReactNode[] = [];
  if (before) nodes.push(before);
  nodes.push(
    isBold ? (
      <strong key={`${keyPrefix}-b`}>{innerNodes}</strong>
    ) : (
      <u key={`${keyPrefix}-u`}>{innerNodes}</u>
    ),
  );
  nodes.push(...parseFormattedText(after, `${keyPrefix}-a`));

  return nodes;
};

const ChatContent = ({ role, content, timestamp }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = role === "assistant";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-4 px-4 py-6
        ${isAssistant ? "bg-gray-200/20" : "bg-white"}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
          ${isAssistant ? "bg-[#1d86ba] text-white" : "bg-[#334051] text-white"}`}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isAssistant ? "MeetRecap" : "You"}
          </span>
          {timestamp && <span className="text-xs">{timestamp}</span>}
        </div>

        <div className="prose prose-sm max-w-none text-base">
          <div className="whitespace-pre-wrap select-text">
            {isAssistant ? parseFormattedText(content) : content}
          </div>
        </div>

        {isAssistant && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatContent;
