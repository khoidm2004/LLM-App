interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}
const ChatContent = ({ role, content, timestamp }: ChatMessageProps) => {
  return (
    <div className="bg-pink-300">
      <div>{role}</div>
      <div>{content}</div>
      {timestamp && <div>{timestamp}</div>}
    </div>
  );
};

export default ChatContent;
