import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRecoilValue } from 'recoil';
import { userState } from '../../store/userStore';
import { useVideoUpload, useVideos } from '../../hooks/useVideo';
import VideoSkeleton from './VideoSkeleton';
import { ProcessingStatus } from '../../types/video';
import { toast } from 'sonner';
import { useBlocker } from 'react-router-dom';

import axios1 from '../../config/axios';
import axios,{isAxiosError} from 'axios';

import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { ConfirmDialog } from '../lib/model';
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${month} ${day}, ${year} ${hours}:${minutes}`;
};

const VideoList = () => {
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const { data: videos, isLoading: isLoadingVideos, refetch } = useVideos();
  const auth = useRecoilValue(userState);
  const { uploadVideo, isUploading } = useVideoUpload();
  const [videoToDelete, setVideoToDelete] = useState<{ id: string; title: string } | null>(null);



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewVideoTitle(file.name); // Set default title but allow user to change it
      setIsUploadModalOpen(true);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !newVideoTitle.trim()) return;

    try {
      console.log('Starting upload process with:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        title: newVideoTitle
      });

      


      // Get presigned URL and video ID
      const { data: presignedData } = await axios1.post('/video', { title: newVideoTitle });
      const { id, url, fields } = presignedData;

      // Store the upload details in localStorage
      localStorage.setItem(`upload_${id}`, JSON.stringify({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        title: newVideoTitle,
        progress: 0
      }));


      // Use the browser's FormData
      const formData = new FormData();
      formData.append('key', fields.key);
      formData.append('x-amz-algorithm', fields['x-amz-algorithm']);
      formData.append('x-amz-credential', fields['x-amz-credential']);
      formData.append('x-amz-date', fields['x-amz-date']);
      formData.append('policy', fields.policy);
      formData.append('x-amz-signature', fields['x-amz-signature']);
      formData.append('file', selectedFile);


      console.log("headers", formData);


      // Create a clean axios instance without auth headers
      const cleanAxios = axios.create();  
      delete cleanAxios.defaults.headers.common['Authorization'];
      
      // Upload to S3 with the clean instance
      console.log("uploadig to url", url);

      //close the model
      setIsUploadModalOpen(false);

      const response = await cleanAxios.post(url, formData, {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          console.log("progress", progress);
          setUploadProgress(prev => ({ ...prev, [id]: progress }));
        },
      });

      //on 100% progress, remove the upload from localStorage
      setUploadProgress(prev => ({ ...prev, [id]: 100 }));
      setTimeout(() => {
        localStorage.removeItem(`upload_${id}`);
      }, 1000);


      console.log("response ");
      console.log('S3 upload response:', response);

      startPolling(id);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      if (isAxiosError(error)) {
        console.error('Response:', error.response?.data);
      }
      toast.error('Failed to upload video');
    }

    setNewVideoTitle('');
    setSelectedFile(null);
    setIsUploadModalOpen(false);
  };

  const startPolling = (videoId: string) => {
    console.log("polling videoId", videoId);
    const pollInterval = setInterval(async () => {
      try {
        const { data: videoStatus } = await axios.get(`/video/${videoId}`);
        console.log("videoStatus", videoStatus);
        if (videoStatus.status === ProcessingStatus.COMPLETED || 
            videoStatus.status === ProcessingStatus.FAILED) {
          clearInterval(pollInterval);
          refetch(); 
        }
      } catch (error) {
        console.error('Polling failed:', error);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    const toastId = toast.loading(`Deleting video: ${videoTitle}...`);
    try {
      await axios1.delete(`/video/${videoId}`);
      toast.success(`Successfully deleted: ${videoTitle}`, {
        id: toastId
      });
      await refetch(); 
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(`Failed to delete: ${videoTitle}`, {
        id: toastId
      });
    }
  };

  if (!auth.isAuthenticated) {
    return null;
  }
  console.log("videos", videos);

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
          onChange={handleFileSelect}
          accept="video/*"
          className="hidden"
          id="video-upload"
        />

        <AnimatePresence>
          {isUploadModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsUploadModalOpen(false)}
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
                    <h3 className="text-xl font-semibold">Upload Video</h3>
                    <button 
                      onClick={() => setIsUploadModalOpen(false)} 
                      className="text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleUploadSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Video Title</label>
                      <input
                        type="text"
                        value={newVideoTitle}
                        onChange={(e) => setNewVideoTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="text-sm text-gray-400">
                      Selected file: {selectedFile?.name}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold"
                      type="submit"
                    >
                      Start Upload
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {isLoadingVideos ? (
          <VideoSkeleton />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {videos?.map((video) => (
              <motion.div
                key={video.id}
                className="bg-gray-700 rounded-lg p-6"
                whileHover={{ scale: 1.01 }}
              >
                <div className="aspect-video bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
                  <VideoCameraIcon className="w-16 h-16 text-gray-400" />
                </div>

                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <h3 className="text-xl font-semibold">
                      {video.title}
                    </h3>
                    
                    <div className="mt-3 flex items-center gap-2">
                      {video.status === ProcessingStatus.CREATED && (
                        <>
                          <ClockIcon className="w-5 h-5 text-blue-400 animate-pulse" />
                          <span className="text-blue-400">Upload Created...</span>
                        </>
                      )}
                      {video.status === ProcessingStatus.VERIFIED && (
                        <>
                          <CheckCircleIcon className="w-5 h-5 text-green-400" />
                          <span className="text-green-400">Upload Verified</span>
                        </>
                      )}
                      {video.status === ProcessingStatus.PENDING && (
                        <>
                          <ClockIcon className="w-5 h-5 text-yellow-400 animate-pulse" />
                          <span className="text-yellow-400">Pending Processing...</span>
                        </>
                      )}
                      {video.status === ProcessingStatus.PROCESSING && (
                        <>
                          <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-yellow-400">Processing Video...</span>
                        </>
                      )}
                      {video.status === ProcessingStatus.COMPLETED && (
                        <>
                          <CheckCircleIcon className="w-5 h-5 text-green-400" />
                          <span className="text-green-400">Processing Complete</span>
                        </>
                      )}
                      {video.status === ProcessingStatus.FAILED && (
                        <>
                          <XCircleIcon className="w-5 h-5 text-red-400" />
                          <span className="text-red-400">Processing Failed</span>
                        </>
                      )}
                    </div>

                    {uploadProgress[video.id] !== undefined && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-600 rounded-full h-2.5">
                          <div
                            className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[video.id]}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Upload Progress: {uploadProgress[video.id]}%
                        </p>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-gray-400 space-y-1">
                      <p>Created: {formatDate(video.created_at)}</p>
                      <p>Updated: {formatDate(video.updated_at)}</p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setVideoToDelete({ id: video.id, title: video.title })}
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

      <ConfirmDialog
        isOpen={!!videoToDelete}
        onClose={() => setVideoToDelete(null)}
        onConfirm={() => {
          if (videoToDelete) {
            handleDeleteVideo(videoToDelete.id, videoToDelete.title);
            setVideoToDelete(null);
          }
        }}
        title="Delete Video"
        description={`Are you sure you want to delete "${videoToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default VideoList; 