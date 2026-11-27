import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Paperclip, X, FileText } from "lucide-react";
import {
  MAX_FILES_PER_SESSION,
  SUMMARY_LENGTHS,
  validateNewFiles,
  type SummaryLength,
} from "../../lib/documentUpload";

interface ChatInputProps {
  onSend: (message: string) => void;
  onUploadSummarize: (files: File[], length: SummaryLength) => void;
  isLoading?: boolean;
}

const LENGTH_LABELS: Record<SummaryLength, string> = {
  short: "Short",
  medium: "Medium",
  detailed: "Detailed",
};

const ChatInput = ({ onSend, onUploadSummarize, isLoading = false }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAttachedFiles = attachedFiles.length > 0;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles = Array.from(fileList);
    const error = validateNewFiles(newFiles, attachedFiles.length);
    if (error) {
      setFileError(error);
    } else {
      setFileError(null);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const handleSubmit = () => {
    if (isLoading) return;

    if (hasAttachedFiles) {
      onUploadSummarize(attachedFiles, summaryLength);
      setAttachedFiles([]);
      setFileError(null);
      return;
    }

    if (message.trim()) {
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
    <div className="border-t border-gray-400/50 dark:border-gray-700 bg-[#f9fafc] dark:bg-gray-950 p-3 sm:p-4">
      <div className="mx-auto max-w-3xl">
        {hasAttachedFiles && (
          <div className="mb-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-40 truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachedFile(index)}
                    aria-label={`Remove ${file.name}`}
                    className="shrink-0 rounded hover:bg-blue-200 dark:hover:bg-blue-500/30"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span>Summary length:</span>
              <div className="flex gap-1 rounded-lg bg-gray-200 dark:bg-gray-800 p-0.5">
                {SUMMARY_LENGTHS.map((length) => (
                  <button
                    key={length}
                    onClick={() => setSummaryLength(length)}
                    className={`rounded-md px-2 py-1 ${
                      summaryLength === length
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {LENGTH_LABELS[length]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {fileError && (
          <p className="mb-2 text-xs text-red-600 dark:text-red-400">{fileError}</p>
        )}

        <div className="relative flex items-end gap-2 rounded-xl border-3 border-blue-400/50 dark:border-blue-500/40 bg-[#f1f4f9] dark:bg-gray-800 p-2  transition-all">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || attachedFiles.length >= MAX_FILES_PER_SESSION}
            title="Attach meeting documents (PDF, DOC, DOCX, TXT)"
            className="h-10 w-10 shrink-0 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40"
          >
            <Paperclip className="mx-auto h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasAttachedFiles
                ? "Files attached — click send to generate a summary"
                : "Paste your meeting notes here..."
            }
            disabled={isLoading || hasAttachedFiles}
            className="min-h-11 max-h-50 flex-1 resize-none bg-[#f1f4f9] dark:bg-gray-800 dark:text-gray-100 p-2 text-sm disabled:opacity-60"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={(!message.trim() && !hasAttachedFiles) || isLoading}
            className="h-10 w-10 px-2 shrink-0 rounded-lg bg-[#7abcdf] text-white"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-xs md:text-base dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
