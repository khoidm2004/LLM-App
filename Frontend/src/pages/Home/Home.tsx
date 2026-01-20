import { useState } from "react";
import ChatContent from "../../components/ChatContent/ChatContent";
import ChatHeader from "../../components/ChatHeader/ChatHeader";
import ChatInput from "../../components/ChatInput/ChatInput";
import Sidebar from "../../components/Sidebar/Sidebar";

const Home = () => {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <ChatContent />
          <ChatInput />
        </div>
      </div>
    </>
  );
};

export default Home;
