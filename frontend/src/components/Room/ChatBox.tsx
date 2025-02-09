import { useState, useRef, useEffect } from "react";

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
};


export const ChatBox = ({
  messages,
  isConnected,
  sendMessage,
  currentUserId,  
  userName,
}: {
  messages: any[];
  isConnected: boolean;
  sendMessage: (message: string) => void;
  currentUserId: string;
  userName: string;
}) => {
  const [message, setMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };



  // Scroll to bottom on new messages
  useEffect(() => {
    if (messageContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = messageContainerRef.current;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
      
      if (isAtBottom) {
        scrollToBottom();
      } else {
      }
    }
  }, [messages]);

  if (!currentUserId) return <div>No user id</div>;

  if (!userName) return <div>No user name</div>;

  if (messages.length === 0) return <div>No messages yet</div>;


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage(message);
    setMessage("");
  };

  if (!isConnected) return <div>Connecting...</div>;

  console.log("Frontend messages", messages);
  console.log("Current User ID", currentUserId);

  return (
    <div className="w-80 bg-gray-800 rounded-lg flex flex-col shadow-xl h-[500px]">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
        <div className="text-sm text-gray-400">
          {isConnected ? "Connected" : "Connecting..."}
        </div>
      </div>

      <div 
        ref={messageContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[350px] relative no-scrollbar"
      >
        {messages.map((msg, index) => {
          
          const isCurrentUser = msg.user_id === currentUserId;

          return (
            <div key={index} >
              {msg.type === "chat" ? (
                <div
                  className={`space-y-1 ${
                    isCurrentUser ? "ml-auto" : "mr-auto"
                  }`}
                  style={{ maxWidth: "80%" }}
                >
                  <div
                    className={`text-sm text-white ${
                      isCurrentUser ? "text-right" : "text-left"
                    }`}
                  >
                    {msg.user_name || ''}
                  </div>
                  <div
                    className={`rounded-lg p-3 text-white ${
                      isCurrentUser ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <div
                    className={`text-sm text-gray-400 ${
                      isCurrentUser ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center my-2">
                  <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                 {
                  msg.type === "join" ? `${msg.user_name} joined the room  at ${formatTimestamp(msg.timestamp)}` : 
                  msg.type === "leave" ? `${msg.user_name} left the room  at ${formatTimestamp(msg.timestamp)}` :
                  msg.type === "error" ? `${msg.message}` : `${msg.message}`
                 }
                  </span>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>


      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 mt-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
