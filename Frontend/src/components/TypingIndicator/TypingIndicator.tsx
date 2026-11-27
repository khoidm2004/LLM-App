import { Bot } from "lucide-react";

const TypingIndicator = () => {
  return (
    <div className="flex gap-4 px-4 py-6 bg-gray-200/20 dark:bg-gray-800/30">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1d86ba] text-white">
        <Bot className="h-4 w-4" />
      </div>

      <div className="flex items-center">
        <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <span
            className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 [animation:bubble-dot_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 [animation:bubble-dot_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: "200ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 [animation:bubble-dot_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: "400ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
