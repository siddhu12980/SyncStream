import { useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

export const ChatBox = ({ roomId, currentUserId }: { roomId: string, currentUserId: string }) => {
  const [message, setMessage] = useState('');
  const { messages, isConnected, sendMessage } = useWebSocket(roomId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendMessage(message);
    setMessage('');
  };

  if (!isConnected) return <div>Connecting...</div>;

  console.log("Frontend messages", messages);

  return (
    <div className="w-80 bg-gray-800 rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="text-sm text-gray-400">
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          // Limit username to 5 characters
          const truncatedUserId = msg.user_id.slice(0, 5);
          
          // Determine if message is from current user (you'll need to pass currentUserId as a prop)
          const isCurrentUser = msg.user_id === currentUserId;

          return (
            <div 
              key={index} 
              className={`space-y-1 ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}
              style={{ maxWidth: '80%' }}
            >
              <div className={`text-sm text-white ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                {truncatedUserId}
              </div>
              <div 
                className={`rounded-lg p-3 text-white ${
                  isCurrentUser ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                {msg.message}
              </div>
              <div className={`text-sm text-gray-400 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
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
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}; 