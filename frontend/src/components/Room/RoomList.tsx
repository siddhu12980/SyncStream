import { motion, AnimatePresence } from "framer-motion";
import { useRooms, useCreateRoom, useDeleteRoom } from "../../hooks/useRoom";
import { useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  VideoCameraIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRecoilValue } from "recoil";
import { userState } from "../../store/userStore";
import { useVideoUpload, useVideos } from "../../hooks/useVideo";
import RoomSkeleton from "./RoomSkeleton";
import { ProcessingStatus } from "../../types/video";
import clsx from "clsx";

const RoomList = () => {
  const [newRoomName, setNewRoomName] = useState<string>("");
  const [newRoomDescription, setNewRoomDescription] = useState<string>("");
  const { data: rooms, isLoading: isLoadingRooms } = useRooms();
  const { data: videos } = useVideos();
  const createRoom = useCreateRoom();
  const deleteRoom = useDeleteRoom();
  const auth = useRecoilValue(userState);
  const { uploadVideo, isUploading } = useVideoUpload();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  


  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      createRoom.mutate({
        name: newRoomName,
        description: newRoomDescription,
      });
      setNewRoomName("");
      setNewRoomDescription("");
      setIsModalOpen(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    roomId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadVideo({
      title: file.name,
      file,
    });
  };

  const getStatusColor = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.COMPLETED:
        return "text-green-400";
      case ProcessingStatus.FAILED:
        return "text-red-400";
      case ProcessingStatus.PROCESSING:
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  console.log("Rooms", rooms);  


  return (
    <div className="mt-24">
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Rooms</h2>
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
                      <input
                        id="room-name"
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Room Name"
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        id="room-description"
                        type="text"
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                        placeholder="Room Description"
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
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
          <div className="grid md:grid-cols-3 gap-6">
            {rooms?.map((room: any) => {
              const roomVideos =
                videos?.filter((v) => v.created_by === auth.user?.id) || [];

              return (
                <motion.div
                  key={room.id}
                  className="bg-gray-700 rounded-lg p-4"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {room.name}
                        <span className="text-sm text-gray-400">
                          ({roomVideos.length})
                        </span>
                      </h3>
                      <div className="mt-2 space-y-1">
                        {roomVideos.map((video) => (
                          <div
                            key={video.id}
                            className={clsx(
                              "text-sm flex items-center gap-2",
                              getStatusColor(video.status)
                            )}
                          >
                            <VideoCameraIcon className="w-4 h-4" />
                            {video.title}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          document
                            .getElementById(`video-upload-${room.id}`)
                            ?.click()
                        }
                        className="text-blue-400 hover:text-blue-300"
                        disabled={isUploading}
                      >
                        <ArrowUpTrayIcon className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteRoom.mutate(room.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, room.id)}
                    accept="video/*"
                    className="hidden"
                    id={`video-upload-${room.id}`}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;
