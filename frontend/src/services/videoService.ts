import axiosInstance from '../config/axios';
import { VideoTask, VideoUploadResponse } from '../types/video';

export const videoService = {
  uploadVideo: async (title: string) => {
    const response = await axiosInstance.post<VideoUploadResponse>('/video', { 
      title
    });
    return response.data;
  },

  uploadToS3: async (url: string, fields: Record<string, string>, file: File) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', file);

    await fetch(url, {
      method: 'POST',
      body: formData,
    });
  },

  getVideoStatus: async (id: string) => {
    const response = await axiosInstance.get<VideoTask>(`/video/${id}`);
    return response.data;
  },

  getAllVideos: async () => {
    const response = await axiosInstance.get<VideoTask[]>('/video');
    return response.data;
  },

  deleteVideo: async (id: string) => {
    const response = await axiosInstance.delete(`/video/${id}`);
    return response.data;
  },

  // We'll add this later when backend supports it
  attachToRoom: async (videoId: string, roomId: string) => {
    const response = await axiosInstance.post(`/video/${videoId}/attach`, { roomId });
    return response.data;
  }
}; 