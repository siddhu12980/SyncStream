import { userState } from "../store/userStore";
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

interface Message {
    type: string;
    error?: string;
    user_id: string;
    message: string;
    timestamp: string;
}

// {
//     "type": "join",
//     "user_id": "a755b447-7da6-4b04-a364-50b11b0ebbab",
//     "message": "User a755b447-7da6-4b04-a364-50b11b0ebbab joined the room",
//     "timestamp": "2025-02-04T22:44:30.154925"
// }

export const useWebSocket = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const auth = useRecoilValue(userState);

  if (!auth.user) return { messages: [], isConnected: false, sendMessage: () => {} };
  

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    if (!auth.user?.id) return { messages: [], isConnected: false, sendMessage: () => {} };

    const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}?user_id=${auth.user!.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      toast.success('Connected to chat');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);
      setMessages(prev => [...prev, message]);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after a delay
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Chat connection error');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending message:', content);

      wsRef.current.send(JSON.stringify({ 
        type: 'chat',
        user_id: auth.user!.id,
        message: content,
       }));
    } else {
      toast.error('Not connected to chat');
    }
  }, []);

  return {
    messages,
    isConnected,
    sendMessage
  };
}; 