import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomService } from '../services/roomService';
import { toast } from 'sonner';
import { VideoType } from '@/types/room';

interface YoutubeVideoInfo {
  title: string;
  url: string;
  thumb: string;
  description: string;
  creator: string;
  creatorurl: string;
  views: number;
}

export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: roomService.getRooms
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roomService.createRoom,
    onSuccess: () => {
      toast.success('Room created successfully!');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create room');
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roomService.deleteRoom,
    onSuccess: () => {
      toast.success('Room deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete room');
    },
  });
};

export const useValidateYoutubeUrl = () => {
  return useMutation({
    mutationFn: roomService.validateYoutubeUrl,
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to validate YouTube URL');
    },
  });
};

export const useAddVideoToRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roomId, videoKey, videoType = 'default' }: { 
      roomId: string; 
      videoKey: string;
      videoType?: 'default' | 'youtube';
    }) => 
      roomService.addVideoToRoom(roomId, { 
        video_key: videoKey,
        video_type: videoType as VideoType
      }),
    onSuccess: () => {
      toast.success('Video added to room successfully!');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add video to room');
    },
  });
}; 