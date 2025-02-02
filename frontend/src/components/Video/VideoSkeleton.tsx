import { motion } from 'framer-motion';

const VideoSkeleton = () => {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-700 rounded-lg p-4"
        >
          <div className="flex justify-between items-start">
            <div className="w-full">
              <div className="h-6 bg-gray-600 rounded-md w-3/4 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-600/50 rounded-md w-1/4 animate-pulse" />
            </div>
            <div className="w-5 h-5 bg-gray-600 rounded-md animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default VideoSkeleton; 