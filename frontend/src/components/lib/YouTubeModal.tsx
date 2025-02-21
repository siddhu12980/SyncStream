import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { VideoCameraIcon } from "@heroicons/react/24/outline";

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  youtubeUrl: string;
  onUrlChange: (url: string) => void;
  onValidate: () => void;
  videoInfo: {
    thumb: string;
    title: string;
    creator: string;
    views: number;
  } | null;
}

export const YouTubeModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  youtubeUrl, 
  onUrlChange,
  onValidate,
  videoInfo 
}: YouTubeModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
      >
        <div className="bg-gray-800 rounded-xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-semibold">Add YouTube Video</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <XMarkIcon className="w-8 h-8" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="Enter YouTube URL"
                className="flex-1 px-5 py-3 text-lg bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={onValidate}
                className="px-6 py-3 text-lg bg-blue-500 hover:bg-blue-600 rounded-xl"
              >
                Validate
              </button>
            </div>

            {youtubeUrl && !videoInfo && (
              <div className="bg-gray-700 rounded-xl p-6 text-center">
                <VideoCameraIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No video found</p>
                <p className="text-gray-500 text-sm mt-2">Please check the URL and try again</p>
              </div>
            )}

            {videoInfo && videoInfo.title && videoInfo.thumb && (
              <div className="bg-gray-700 rounded-xl p-6">
                <img src={videoInfo.thumb} alt="Thumbnail" className="w-full rounded-xl mb-6" />
                <h4 className="text-xl font-semibold mb-3">{videoInfo.title}</h4>
                <p className="text-base text-gray-400 mb-2">By {videoInfo.creator || 'Unknown creator'}</p>
                <p className="text-base text-gray-400 mb-6">
                  {typeof videoInfo.views === 'number' 
                    ? `${videoInfo.views.toLocaleString()} views`
                    : 'Views not available'}
                </p>
                <button
                  onClick={onConfirm}
                  className="w-full py-4 text-lg bg-blue-500 hover:bg-blue-600 rounded-xl"
                >
                  Add This Video
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 