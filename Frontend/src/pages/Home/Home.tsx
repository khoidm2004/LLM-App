import { useEffect, useRef, useState } from "react";
import ChatContent from "../../components/ChatContent/ChatContent";
import ChatHeader from "../../components/ChatHeader/ChatHeader";
import ChatInput from "../../components/ChatInput/ChatInput";
import Sidebar from "../../components/Sidebar/Sidebar";
import ChatPlaceHolder from "../../components/ChatPlaceHolder/ChatPlaceHolder";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);
  const handleSendMessage = async (content: string) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
      date: "Just now",
      messages: [],
    };
    setConversations((prev) => [newConversation, ...prev]);

    // Add user message and generate response
    setTimeout(() => {
      addMessage(newConversation.id, content);
    }, 100);
  };

  const addMessage = async (conversationId: string, content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setConversations((prev: Conversation[]) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title:
                conv.messages.length === 0
                  ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
                  : conv.title,
            }
          : conv,
      ),
    );

    setIsLoading(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Here is a summary of your meeting",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, assistantMessage] }
          : conv,
      ),
    );

    setIsLoading(false);
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
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
              <div className="mx-auto max-w-3xl">
                {activeConversation.messages.map((message) => (
                  <ChatContent
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-4 px-4 py-6 bg-accent/30">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-bounce" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">
                        Generating summary...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ChatPlaceHolder />
            )}
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
