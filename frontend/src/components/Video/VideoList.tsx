import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useRecoilValue } from 'recoil';
import { userState } from '../../store/userStore';
import { useVideoUpload, useVideos } from '../../hooks/useVideo';
import VideoSkeleton from './VideoSkeleton';
import { ProcessingStatus } from '../../types/video';
import clsx from 'clsx';
import axios from '../../config/axios';

const VideoList = () => {
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const { data: videos, isLoading: isLoadingVideos, refetch } = useVideos();
  const auth = useRecoilValue(userState);
  const { uploadVideo, isUploading } = useVideoUpload();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const title = newVideoTitle || file.name;
    
    try {
      // Get presigned URL and video ID
      const { data: presignedData } = await axios.post('/video', { title });
      const { id, url, fields } = presignedData;

      // Create form data for S3 upload
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      // Upload to S3 with progress tracking
      await axios.post(url, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadProgress(prev => ({ ...prev, [id]: progress }));
        },
      });

      // Start polling for video status
      startPolling(id);
      
    } catch (error) {
      console.error('Upload failed:', error);
    }

    setNewVideoTitle('');
  };

  const startPolling = (videoId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data: videoStatus } = await axios.get(`/video/${videoId}`);
        if (videoStatus.status === ProcessingStatus.COMPLETED || 
            videoStatus.status === ProcessingStatus.FAILED) {
          clearInterval(pollInterval);
          refetch(); // Refresh video list
        }
      } catch (error) {
        console.error('Polling failed:', error);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds
  };

  const getStatusColor = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.COMPLETED:
        return 'text-green-400';
      case ProcessingStatus.FAILED:
        return 'text-red-400';
      case ProcessingStatus.PROCESSING:
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Videos</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.getElementById('video-upload')?.click()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center gap-2 text-sm"
            disabled={isUploading}
          >
            <PlusIcon className="w-4 h-4" />
            Upload Video
          </motion.button>
        </div>

        <input
          type="file"
          onChange={handleFileUpload}
          accept="video/*"
          className="hidden"
          id="video-upload"
        />

        {isLoadingVideos ? (
          <VideoSkeleton />
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {videos?.map((video) => (
              <motion.div
                key={video.id}
                className="bg-gray-700 rounded-lg p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <VideoCameraIcon className="w-5 h-5" />
                      {video.title}
                    </h3>
                    <p className={clsx(
                      "text-sm mt-2",
                      getStatusColor(video.status)
                    )}>
                      Status: {video.status}
                    </p>
                    {uploadProgress[video.id] !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[video.id]}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Uploading: {uploadProgress[video.id]}%
                        </p>
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <TrashIcon className="w-5 h-5" />
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

export default VideoList; 