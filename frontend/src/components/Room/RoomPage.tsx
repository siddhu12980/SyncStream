import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { VideoPlayer } from "./VideoPlayer";
import axios1 from "../../config/axios";
import { ArrowLeftIcon, ChatBubbleLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChatBox } from "./ChatBox";
import { userState } from "../../store/userStore";
import { useRecoilValue } from "recoil";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  description: string;
  video_key: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export default function RoomPage() {
  const { id } = useParams();
  //this is the count ref for the unread messages
  const lastMessageRef = useRef<number>(0);

  const navigate = useNavigate();

  if (!id) {
    navigate("/");
    return null;
  }

  const auth = useRecoilValue(userState);

  const generateRandomId = useCallback(() => {
    // Get existing random ID from localStorage or generate new one
    const existingRandomId = localStorage.getItem('randomUserId');
    if (existingRandomId) return existingRandomId;
    
    const newRandomId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('randomUserId', newRandomId);
    return newRandomId;
  }, []);

  // This will now remain consistent across renders
  const random_id = generateRandomId();

  const local_store_user_Name = localStorage.getItem("userName");

  const user_id = auth.user?.id || random_id;
  const user_name = auth.user?.username || local_store_user_Name || random_id;

  const {
    data: room,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      if (!id) throw new Error("No room ID");
      const response = await axios1.get(`/public/room/${id}`);
      console.log("Room Data", response.data);
      return response.data as Room;
    },
    staleTime: 1000 * 60,
    retry: false,
    enabled: true,
  });

  let isAdmin = false;

  if (room?.created_by == user_id) {
    isAdmin = true;
  }

  const { messages, isConnected, sendMessage, sendVideoEvent, onVideoEvent } =
    useWebSocket(id, user_name, user_id, isAdmin);

  const [lastVideoEvent, setLastVideoEvent] = useState<{
    event_type: "play" | "pause" | "forward_10" | "back_10" | "video_time";
    video_time: number;
  } | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleChatToggle = useCallback(() => {
    setIsChatOpen(prev => {
      if (!prev) {  // If we're opening the chat
        setUnreadCount(0);  // Reset the count
      }
      return !prev;  // Toggle the chat
    });
  }, []);


  useEffect(() => {
    return () => {
      if (isConnected) {
        console.log("Disconnecting from the room");
        toast.success("Disconnected from the room");
      }
    };
  }, []);


  useEffect(() => {

    if (!isChatOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];


      if (lastMessage.type === "chat" && lastMessage.user_id !== user_id) {

        if (lastMessageRef.current < messages.length) {
          setUnreadCount(prev => prev + 1);
        }

      }
    }
    lastMessageRef.current = messages.length;
  }, [messages, isChatOpen, user_id]);

  useEffect(() => {
    if (isAdmin) return;
    onVideoEvent((event) => {
      console.log("handelling Remote Video Event:", event);
      setLastVideoEvent(event);
    });
  }, [onVideoEvent]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="animate-pulse h-4 w-24 bg-gray-700 rounded mb-4"></div>
        <div className="animate-pulse aspect-video bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  if (isSuccess) {
    if (!room?.video_key) {
      navigate("/", { replace: true });
    }
  }

  if (isError || !room) {
    navigate("/", { replace: true });
    return null;
  }



  const url = `https://sidd-bucket-fast-api.s3.ap-south-1.amazonaws.com/videos/${room.video_key}/master.m3u8`;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Rooms
        </button>

        <div className="flex gap-6 relative">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-4">{room.name}</h1>
            {room.description && (
              <p className="text-gray-400 mb-6">{room.description}</p>
            )}

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {room.video_key && (
                <VideoPlayer
                  isAdmin={isAdmin}
                  videoUrl={url}
                  onVideoEvent={isAdmin ? sendVideoEvent : undefined}
                  remoteVideoEvent={!isAdmin ? lastVideoEvent : undefined}
                />
              )}
            </div>
          </div>

          <button
            onClick={handleChatToggle}
            className="fixed bottom-6 right-6 p-3 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg z-50 "
          >
            {isChatOpen ? (
              <XMarkIcon className="w-6 h-6 text-white" />
            ) : (
              <>
                <ChatBubbleLeftIcon className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </div>
                )}
              </>
            )}
          </button>

          <div
            className={`fixed right-6 bottom-20 transition-transform duration-300 ease-in-out ${
              isChatOpen ? 'translate-x-0' : 'translate-x-[400px]'
            }`}
          >
            <ChatBox
              messages={messages}
              isConnected={isConnected}
              sendMessage={sendMessage}
              currentUserId={user_id}
              userName={user_name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
