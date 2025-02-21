import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ChatMessage {
    type: 'chat' | 'join' | 'leave';
    error?: string;
    user_id: string;
    message: string;
    user_name?: string;
    timestamp: string;
}

export interface VideoEvent {
    type: 'video_event';
    user_id: string;
    event_type: 'play' | 'pause' | 'forward_10' | 'back_10' | 'video_time';
    video_time: number;
    timestamp: string;
}

type Message = ChatMessage | VideoEvent;

export const useWebSocket = (roomId: string, userName: string, userId: string, isAdmin: boolean) => {


  console.log("isAdmin",isAdmin)
  

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const videoEventCallbackRef = useRef<((event: VideoEvent) => void) | null>(null);

  const retryCountRef = useRef(0);

  const intentionalDisconnectRef = useRef(false);


  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (!userId || !userName) return { messages: [], isConnected: false, sendMessage: () => {} };
    
    if (intentionalDisconnectRef.current) return;
    
    if (retryCountRef.current >= 3) {
      console.log('Max retry attempts reached');
      toast.error('Failed to connect to chat. Please try again later.');
      return;
    }


    const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}?user_id=${userId}&name=${userName}`);

    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      retryCountRef.current = 0;
      toast.success('Connected to chat');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as Message;
      console.log('Received message:', message);
      
      if (message.type === 'video_event') {
        // Handle video events  
        console.log('Video event:', message);
        videoEventCallbackRef.current?.(message as VideoEvent);

      } else {
        // Handle chat messages
        setMessages(prev => [...prev, message as ChatMessage]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (!intentionalDisconnectRef.current) {
        console.log('Reconnecting to chat');
        retryCountRef.current += 1;
        toast.error('Disconnected from the room reconnecting...');
        setTimeout(connect, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Chat connection error');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        intentionalDisconnectRef.current = true;

        ws.close();

        toast.success('Disconnected from the room');
      }
    };
  }, [roomId, userId, userName]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        intentionalDisconnectRef.current = true;
        wsRef.current.close();
        toast.success('Disconnected from the room');
      }
    };
  }, [connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending message:', content);

      wsRef.current.send(JSON.stringify({ 
        type: 'chat',
        user_id: userId,
        message: content,
        user_name: userName
       }));
    } else {
      toast.error('Not connected to chat');
    }
  }, [userId, userName]);

  const sendVideoEvent = useCallback((event: {
    type: 'play' | 'pause' | 'forward_10' | 'back_10' | 'video_time';
    video_time: number;
  }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending video event:', event);

      wsRef.current.send(JSON.stringify({
        type: 'video_event',
        user_id: userId,
        event_type: event.type,
        video_time: event.video_time
      }));
    } else {
      toast.error('Not connected to video sync');
    }
  }, [userId]);

  const onVideoEvent = useCallback((callback: (event: VideoEvent) => void) => {
    videoEventCallbackRef.current = callback;
    
  }, []);

  return {
    messages,
    isConnected,
    sendMessage,
    sendVideoEvent,
    onVideoEvent
  };
}; 