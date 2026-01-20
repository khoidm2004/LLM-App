import { Menu, Settings } from "lucide-react";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
}

const ChatHeader = ({ onToggleSidebar }: ChatHeaderProps) => {
  return (
    <header className="flex h-20 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-8 cursor-pointer">
        <button onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#79caf3]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-white"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <h1 className="font-semibold text-2xl">MeetRecap</h1>
        </div>
      </div>
      <button>
        <Settings className="h-5 w-5" />
      </button>
    </header>
  );
};

export default ChatHeader;
