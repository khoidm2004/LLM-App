import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

const ChatInput = ({ onSend, isLoading = false }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t bg-[#f9fafc] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-xl border-3 border-blue-400/50 bg-[#f1f4f9] p-2  transition-all">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your meeting notes here..."
            disabled={isLoading}
            className="min-h-11 max-h-50 flex-1 resize-none bg-[#f1f4f9] p-2 text-sm"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
            className="h-10 w-10 px-2 shrink-0 rounded-lg bg-[#7abcdf] text-white"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-xs md:text-base">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
