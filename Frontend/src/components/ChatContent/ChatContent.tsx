import { Bot, User, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useTypewriter } from "../../hooks/useTypewriter";
import { renderMessageContent } from "./renderMessageContent";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  // Only set for the newest assistant message, so history doesn't replay
  // the typewriter effect every time it re-renders.
  shouldAnimate?: boolean;
  onAnimationComplete?: () => void;
}

const ChatContent = ({
  role,
  content,
  timestamp,
  shouldAnimate = false,
  onAnimationComplete,
}: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = role === "assistant";

  const displayedContent = useTypewriter(
    content,
    isAssistant && shouldAnimate,
    onAnimationComplete,
  );

  const handleCopy = async () => {
    // Always copy the full raw response (markdown markers and table syntax
    // included), never the in-progress typewriter text or rendered HTML.
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group ${isAssistant ? "bg-gray-200/20 dark:bg-gray-800/30" : "bg-white dark:bg-gray-950"}`}
    >
      <div className="flex gap-4 px-4 py-6">
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
            <span className="font-medium text-sm dark:text-gray-100">
              {isAssistant ? "MeetRecap" : "You"}
            </span>
            {timestamp && (
              <span className="text-xs dark:text-gray-400">{timestamp}</span>
            )}
          </div>

          <div className="prose prose-sm max-w-none text-base dark:text-gray-100">
            <div className="whitespace-pre-wrap select-text">
              {isAssistant
                ? renderMessageContent(displayedContent)
                : content}
            </div>
          </div>
        </div>
      </div>

      {isAssistant && (
        <div className="flex justify-end px-4 pb-3">
          <button
            onClick={handleCopy}
            title={copied ? "Copied" : "Copy response"}
            aria-label={copied ? "Copied" : "Copy response"}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatContent;
