import { motion, AnimatePresence } from "framer-motion";
import { useRooms, useCreateRoom, useDeleteRoom, useAddVideoToRoom } from "../../hooks/useRoom";
import { useState } from "react"

import {
  PlusIcon,
  TrashIcon,
  VideoCameraIcon,
  XMarkIcon,
  ArrowRightIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { useRecoilValue } from "recoil";
import { userState } from "../../store/userStore";
import { useVideos } from "../../hooks/useVideo";
import RoomSkeleton from "./RoomSkeleton";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios1 from "../../config/axios";
import { formatDate } from "../../lib/util";
import { YouTubeModal } from "../lib/YouTubeModal";
import { VideoType } from "../../types/room";


interface YouTubeVideoInfo {
  title: string;
  url: string;
  thumb: string;
  creator: string;
  creatorurl: string;
  views: number;
}



const RoomList = () => {
  const [newRoomName, setNewRoomName] = useState<string>("");
  const [newRoomDescription, setNewRoomDescription] = useState<string>("");
  const { data: rooms, isLoading: isLoadingRooms } = useRooms();
  const { data: videos } = useVideos();
  const createRoom = useCreateRoom();
  const deleteRoom = useDeleteRoom();
  const auth = useRecoilValue(userState);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [roomIdToJoin, setRoomIdToJoin] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [youtubeVideoInfo, setYoutubeVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const navigate = useNavigate()
  const addVideoToRoom = useAddVideoToRoom();


  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRoom.mutateAsync({
        name: newRoomName,
        description: newRoomDescription
      });
      setIsCreateModalOpen(false);
      setNewRoomName("");
      setNewRoomDescription("");
    } catch (error) {
      toast.error("Failed to create room");
    }
  };

  const handleRoomClick = (room: any) => {
    if (room.video_key) {
      navigate(`/room/${room.id}`);
    }
  };

  const handleAttachVideo = async (roomId: string, videoKey: string, isYoutube = false) => {
    try {
      await addVideoToRoom.mutateAsync({
        roomId,
        videoKey,
        videoType: isYoutube ? 'youtube' : 'default'
      });
    } catch (error) {
      toast.error("Failed to attach video");
    }
  };

  const handleYoutubeUrlSubmit = async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    try {
      const response = await axios1.get(`/public/yt?url=${youtubeUrl}`);
      if (response.data && response.data[0]) {
        setYoutubeVideoInfo(response.data[0]);
      } else {
        setYoutubeVideoInfo(null);
        toast.error("Could not find video information");
      }
    } catch (error) {
      setYoutubeVideoInfo(null);
      toast.error("Invalid YouTube URL");
    }
  };

  const handleAttachYoutubeVideo = async () => {
    if (!selectedRoomId || !youtubeVideoInfo) return;
    
    try {
      await handleAttachVideo(selectedRoomId, youtubeUrl, true);
      setIsYoutubeModalOpen(false);
      setYoutubeUrl("");
      setYoutubeVideoInfo(null);
    } catch (error) {
      toast.error("Failed to attach YouTube video");
    }
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  console.log("Rooms", rooms);  


  return (
    <div className="mt-8">
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Rooms</h2>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsJoinModalOpen(true)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg flex items-center gap-2 text-sm"
            >
              <ArrowRightIcon className="w-4 h-4" />
              Join Room
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center gap-2 text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              New Room
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isJoinModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsJoinModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
              >
                <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Join Room</h3>
                    <button 
                      onClick={() => setIsJoinModalOpen(false)} 
                      className="text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (roomIdToJoin.trim()) {
                      navigate(`/room/${roomIdToJoin.trim()}`);
                      setIsJoinModalOpen(false);
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Room ID</label>
                      <input
                        type="text"
                        value={roomIdToJoin}
                        onChange={(e) => setRoomIdToJoin(e.target.value)}
                        placeholder="Enter room ID"
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold"
                      type="submit"
                    >
                      Join Room
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCreateModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreateModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
              >
                <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Create New Room</h3>
                    <button 
                      onClick={() => setIsCreateModalOpen(false)} 
                      className="text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Room Name</label>
                      <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold"
                      type="submit"
                    >
                      Create Room
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {isLoadingRooms ? (
          <RoomSkeleton />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {rooms?.map((room) => (
              <motion.div
                key={room.id}
                className="bg-gray-700 rounded-xl p-8 flex flex-col"
                whileHover={{ scale: 1.01 }}
              >
                <div 
                  className="aspect-video bg-gray-600 rounded-xl mb-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-500/50 transition-colors" 
                  onClick={() => handleRoomClick(room)}
                >
                  {room.video_key ? (
                    <>
                      {room.video_type === VideoType.YOUTUBE ? (
                        <PlayCircleIcon className="w-24 h-24 text-red-400" />
                      ) : (
                        <VideoCameraIcon className="w-24 h-24 text-blue-400" />
                      )}
                      <span className={`mt-2 px-3 py-1 text-sm rounded-full ${
                        room.video_type === VideoType.YOUTUBE 
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {room.video_type === VideoType.YOUTUBE ? 'YouTube Video' : 'Uploaded Video'}
                      </span>
                    </>
                  ) : (
                    <>
                      <VideoCameraIcon className="w-24 h-24 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-400">
                        No video attached
                      </span>
                    </>
                  )}
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-semibold">{room.name}</h3>
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          room.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          room.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' :
                          room.status === 'deleted' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {room.status?.charAt(0).toUpperCase() + room.status?.slice(1)}
                        </span>
                      </div>
                      <p className="text-base text-gray-400">{room.description}</p>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteRoom.mutate(room.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-6 h-6" />
                    </motion.button>
                  </div>

                  {!room.video_key && (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <select
                          onChange={(e) => handleAttachVideo(room.id, e.target.value)}
                          className="flex-1 px-4 py-3 text-base bg-gray-600 rounded-xl"
                        >
                          <option value="">Select a processed video...</option>
                          {videos?.map((video) => (
                            <option key={video.id} value={video.id}>
                              {video.title}
                            </option>
                          ))}
                        </select>
                        
                        <button
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            setIsYoutubeModalOpen(true);
                          }}
                          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center gap-2 whitespace-nowrap"
                        >
                          <VideoCameraIcon className="w-5 h-5" />
                          <span>Add YouTube</span>
                        </button>
                      </div>
                      <p className="text-sm text-gray-400">
                        Add a video from your library or import from YouTube
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-6 flex justify-between space-y-1 text-sm text-gray-400">
                    <p>Created: {formatDate(room.created_at)}</p>
                    <p>Updated: {formatDate(room.updated_at)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <YouTubeModal
        isOpen={isYoutubeModalOpen}
        onClose={() => setIsYoutubeModalOpen(false)}
        onConfirm={handleAttachYoutubeVideo}
        youtubeUrl={youtubeUrl}
        onUrlChange={setYoutubeUrl}
        onValidate={handleYoutubeUrlSubmit}
        videoInfo={youtubeVideoInfo ? {
          title: youtubeVideoInfo.title,
          thumb: youtubeVideoInfo.thumb,
          creator: youtubeVideoInfo.creator,
          views: youtubeVideoInfo.views
        } : null}
      />
    </div>
  );
};

export default RoomList;
