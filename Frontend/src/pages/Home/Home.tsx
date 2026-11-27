import { useEffect, useRef, useState } from "react";
import ChatContent from "../../components/ChatContent/ChatContent";
import ChatHeader from "../../components/ChatHeader/ChatHeader";
import ChatInput from "../../components/ChatInput/ChatInput";
import Sidebar from "../../components/Sidebar/Sidebar";
import ChatPlaceHolder from "../../components/ChatPlaceHolder/ChatPlaceHolder";
import TypingIndicator from "../../components/TypingIndicator/TypingIndicator";
import { getOrCreateSessionToken } from "../../lib/uploadSession";
import {
  summarizeDocuments,
  uploadDocuments,
  type SummaryLength,
} from "../../lib/documentUpload";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

const nowLabel = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const Home = () => {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Q1 Planning Meeting",
      date: "Today",
      messages: [],
    },
    {
      id: "2",
      title: "Product Roadmap Review",
      date: "Yesterday",
      messages: [],
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  // Tracks which assistant messages have already finished their typewriter
  // animation, so re-renders (e.g. scrolling, switching tabs) don't replay it.
  const [animatedMessageIds, setAnimatedMessageIds] = useState<Set<string>>(
    new Set()
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  // Stable per-browser identifier for the document-upload session (the app
  // has no login), scoped to Storage/DB rows on the backend.
  const sessionTokenRef = useRef(getOrCreateSessionToken());

  const markMessageAnimated = (id: string) => {
    setAnimatedMessageIds((prev) => new Set(prev).add(id));
  };

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  const appendMessage = (conversationId: string, message: Message) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      )
    );
  };

  const appendUserMessage = (conversationId: string, content: string) => {
    const titleSeed = content.slice(0, 30) + (content.length > 30 ? "..." : "");
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  id: Date.now().toString(),
                  role: "user",
                  content,
                  timestamp: nowLabel(),
                },
              ],
              title: conv.messages.length === 0 ? titleSeed : conv.title,
            }
          : conv
      )
    );
  };

  // Creates a new conversation (seeded with a title) if none is active yet,
  // then runs `action` against it. New conversations need a tick before
  // their id is usable as the active one, hence the setTimeout.
  const ensureConversation = (
    titleSeed: string,
    action: (conversationId: string) => void
  ) => {
    if (!activeConversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: titleSeed.slice(0, 30) + (titleSeed.length > 30 ? "..." : ""),
        date: "Just now",
        messages: [],
      };
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      setTimeout(() => action(newConversation.id), 100);
      return;
    }
    action(activeConversationId);
  };

  const handleSendMessage = (content: string) => {
    ensureConversation(content, (conversationId) =>
      runSummarizeText(conversationId, content)
    );
  };

  const runSummarizeText = async (conversationId: string, content: string) => {
    appendUserMessage(conversationId, content);
    setIsLoading(true);

    try {
      // Use env var for local dev, relative path for production (Vercel proxy)
      const apiUrl = import.meta.env.VITE_API_LINK
        ? `${import.meta.env.VITE_API_LINK}/api/summarize`
        : "/api/summarize";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meetingMinutes: content }),
      });

      if (!response.ok) {
        throw new Error("Failed to get summary");
      }

      const data = await response.json();

      appendMessage(conversationId, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.summary,
        timestamp: nowLabel(),
      });
    } catch (error) {
      console.error("Error:", error);
      appendMessage(conversationId, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, there was an error generating the summary. Please try again.",
        timestamp: nowLabel(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSummarize = (files: File[], length: SummaryLength) => {
    const label = `Uploaded ${files.length} file${files.length > 1 ? "s" : ""}: ${files
      .map((f) => f.name)
      .join(", ")}`;
    ensureConversation(label, (conversationId) =>
      runUploadSummarize(conversationId, files, length, label)
    );
  };

  const runUploadSummarize = async (
    conversationId: string,
    files: File[],
    length: SummaryLength,
    label: string
  ) => {
    appendUserMessage(conversationId, label);
    setIsLoading(true);

    try {
      await uploadDocuments(sessionTokenRef.current, files);
      const summary = await summarizeDocuments(sessionTokenRef.current, length);

      appendMessage(conversationId, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: summary,
        timestamp: nowLabel(),
      });
    } catch (error) {
      console.error("Error:", error);
      appendMessage(conversationId, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Sorry, there was an error generating the summary from your documents. Please try again.",
        timestamp: nowLabel(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
        <div
          className={`hidden md:flex transition-all duration-300 ${desktopSidebarOpen ? "w-64" : "w-0"}`}
        >
          {desktopSidebarOpen && <Sidebar />}
        </div>
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <ChatHeader
            onToggleSidebar={() => {
              if (window.innerWidth <= 768) {
                setSidebarOpen(!sidebarOpen);
              } else {
                setDesktopSidebarOpen(!desktopSidebarOpen);
              }
            }}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            {activeConversation && activeConversation.messages.length > 0 ? (
              <div className="flex-1 overflow-y-auto" ref={scrollRef}>
                <div className="mx-auto max-w-3xl">
                  {activeConversation.messages.map((message, index) => {
                    const isLastMessage =
                      index === activeConversation.messages.length - 1;
                    return (
                      <ChatContent
                        key={message.id}
                        role={message.role}
                        content={message.content}
                        timestamp={message.timestamp}
                        shouldAnimate={
                          isLastMessage &&
                          !animatedMessageIds.has(message.id)
                        }
                        onAnimationComplete={() =>
                          markMessageAnimated(message.id)
                        }
                      />
                    );
                  })}
                  {isLoading && <TypingIndicator />}
                </div>
              </div>
            ) : (
              <ChatPlaceHolder />
            )}
            <ChatInput
              onSend={handleSendMessage}
              onUploadSummarize={handleUploadSummarize}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
