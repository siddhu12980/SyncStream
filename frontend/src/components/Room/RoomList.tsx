import { motion, AnimatePresence } from "framer-motion";
import { useRooms, useCreateRoom, useDeleteRoom } from "../../hooks/useRoom";
import { useState } from "react"

import {
  PlusIcon,
  TrashIcon,
  VideoCameraIcon,
  XMarkIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useRecoilValue } from "recoil";
import { userState } from "../../store/userStore";
import { useVideoUpload, useVideos } from "../../hooks/useVideo";
import RoomSkeleton from "./RoomSkeleton";

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios1 from "../../config/axios";
import { formatDate } from "../../lib/util";
const RoomList = () => {
  const [newRoomName, setNewRoomName] = useState<string>("");
  const [newRoomDescription, setNewRoomDescription] = useState<string>("");
  const { data: rooms, isLoading: isLoadingRooms, refetch } = useRooms();
  const { data: videos } = useVideos();
  const createRoom = useCreateRoom();
  const deleteRoom = useDeleteRoom();
  const auth = useRecoilValue(userState);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [roomIdToJoin, setRoomIdToJoin] = useState<string>("");

  const navigate = useNavigate()

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      createRoom.mutate({
        name: newRoomName,
        description: newRoomDescription,
      });
      setNewRoomName("");
      setNewRoomDescription("");
      setSelectedVideo(null);
      setIsModalOpen(false);
    }
  };

  const handleRoomClick = (room: any) => {
    if (room.video_key) {
      navigate(`/room/${room.id}`);
    }
  };




  const handleAttachVideo = async (roomId: string, videoUrl: string) => {
    if (!videoUrl) return;
    
    try {
      await axios1.post(`/room/add-video/${roomId}`, {
        video_key: videoUrl
      });

      toast.success('Video attached successfully');
      
      refetch();
    } catch (error) {
      console.error('Failed to attach video:', error);
      toast.error('Failed to attach video');
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
              onClick={() => setIsModalOpen(true)}
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
          {isModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
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
                      onClick={() => setIsModalOpen(false)} 
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
                className="bg-gray-700 rounded-lg p-6"
                whileHover={{ scale: 1.01 }}
              >
                <div className="aspect-video bg-gray-600 rounded-lg mb-4 flex items-center justify-center " onClick={() => handleRoomClick(room)}>
                  {room.video_key ? (
                    <VideoCameraIcon className="w-16 h-16 text-blue-400" />
                  ) : (
                    <VideoCameraIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>

                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <h3 className="text-xl font-semibold">
                      {room.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{room.description}</p>
                    
                    {!room.video_key && (
                      <div className="mt-3">
                        <select
                          onChange={(e) => handleAttachVideo(room.id, e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Attach a video...</option>
                          {videos?.map((video) => (
                            <option key={video.id} value={video.id}>
                              {video.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-gray-400 space-y-1">
                      <p>Created: {formatDate(room.created_at)}</p>
                      <p>Updated: {formatDate(room.updated_at)}</p>
                    </div>
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;
