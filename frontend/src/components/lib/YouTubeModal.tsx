import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

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
    description: string;
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
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
      >
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Add YouTube Video</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="Enter YouTube URL"
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={onValidate}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
              >
                Validate
              </button>
            </div>

            {videoInfo && (
              <div className="bg-gray-700 rounded-lg p-4">
                <img src={videoInfo.thumb} alt="Thumbnail" className="w-full rounded-lg mb-4" />
                <h4 className="font-semibold">{videoInfo.title}</h4>
                <p className="text-sm text-gray-400 mt-2">{videoInfo.description}</p>
                <button
                  onClick={onConfirm}
                  className="w-full mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
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