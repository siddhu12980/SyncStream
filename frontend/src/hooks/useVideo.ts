import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { videoService } from '../services/videoService';
import { toast } from 'sonner';
import { useState } from 'react';
import { ProcessingStatus } from '../types/video';

export const useVideoUpload = () => {
  const [uploadProgress, _] = useState(0);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ title, file }: { title: string; file: File }) => {
      const uploadData = await videoService.uploadVideo(title);
      await videoService.uploadToS3(uploadData.url, uploadData.fields, file);
      return uploadData;
    },
    onSuccess: (data) => {
      toast.success('Video upload started!');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      
      const pollInterval = setInterval(async () => {
        try {
          const status = await videoService.getVideoStatus(data.id);
          
          switch (status.status) {
            case ProcessingStatus.COMPLETED:
              toast.success('Video processing completed!');
              clearInterval(pollInterval);
              queryClient.invalidateQueries({ queryKey: ['videos'] });
              break;
            case ProcessingStatus.FAILED:
              toast.error('Video processing failed');
              clearInterval(pollInterval);
              break;
            case ProcessingStatus.PROCESSING:
              toast.loading('Processing video...');
              break;
          }
        } catch (error) {
          console.error('Error polling video status:', error);
          clearInterval(pollInterval);
        }
      }, 5000);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload video');
    },
  });

  return {
    uploadVideo: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    progress: uploadProgress,
  };
};

export const useVideos = () => {
  return useQuery({
    queryKey: ['videos'],
    queryFn: videoService.getAllVideos,
  });
};

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: videoService.deleteVideo,
    onSuccess: () => {
      toast.success('Video deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete video');
    },
  });
}; 