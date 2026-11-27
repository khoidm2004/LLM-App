import { X, CheckCircle2, AlertTriangle } from "lucide-react";

interface OnboardingModalProps {
  onClose: () => void;
}

const DO_ITEMS = [
  "Paste meeting notes directly into the box and hit Send.",
  "Or click the paperclip to attach up to 3 documents (PDF, DOC, DOCX, TXT) and pick a summary length — short, medium, or detailed.",
  "Reopen this guide anytime from the ? button in the header.",
];

const AVOID_ITEMS = [
  "Content that isn't meeting-related — it'll be rejected instead of summarized.",
  "More than 3 files per upload, or any file over 10MB.",
  "Counting on uploaded files to stick around — a session idle for 20 minutes is automatically deleted.",
  "Sensitive or confidential documents — this is a demo app, not a secure document store.",
];

const OnboardingModal = ({ onClose }: OnboardingModalProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold dark:text-gray-100">
            Welcome to MeetRecap
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              How to use it
            </div>
            <ul className="list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
              {DO_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Try not to
            </div>
            <ul className="list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
              {AVOID_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#1d86ba] py-2 text-sm font-medium text-white hover:bg-[#1a76a3]"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;
