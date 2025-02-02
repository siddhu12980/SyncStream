import axiosInstance from '../config/axios';
import { Room, CreateRoomRequest, AddVideoToRoomRequest } from '../types/room';

export const roomService = {
  createRoom: async (data: CreateRoomRequest) => {
    const response = await axiosInstance.post<Room>('/room', data);
    return response.data;
  },

  getRooms: async () => {
    const response = await axiosInstance.get<Room[]>('/room');
    return response.data;
  },

  getRoom: async (id: string) => {
    const response = await axiosInstance.get<Room>(`/room/${id}`);
    return response.data;
  },

  deleteRoom: async (id: string) => {
    const response = await axiosInstance.delete(`/room/${id}`);
    return response.data;
  },

  addVideoToRoom: async (roomId: string, data: AddVideoToRoomRequest) => {
    const response = await axiosInstance.post<Room>(`/room/add-video/${roomId}`, data);
    return response.data;
  },

  removeVideoFromRoom: async (roomId: string, videoKey: string) => {
    const response = await axiosInstance.delete<Room>(`/room/remove-video/${roomId}`, {
      data: { video_key: videoKey }
    });
    return response.data;
  }
}; 