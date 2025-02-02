import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomService } from '../services/roomService';
import { toast } from 'sonner';

// Temporary mock data until backend is ready
const mockRooms = [
  {
    id: '1',
    name: 'Movie Night',
    status: 'created',
    videoIds: [],
    createdBy: 'user1',
    createdAt: new Date().toISOString()
  }
];

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

export const useAddVideoToRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roomId, videoKey }: { roomId: string; videoKey: string }) => 
      roomService.addVideoToRoom(roomId, { video_key: videoKey }),
    onSuccess: () => {
      toast.success('Video added to room successfully!');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add video to room');
    },
  });
}; 