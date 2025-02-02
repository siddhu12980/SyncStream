import { motion } from 'framer-motion';
import { CloudArrowUpIcon,  ArrowRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userState } from '../../store/userStore';
import JoinRoomModal from './JoinRoomModal';
import SignInModal from '../Auth/SignInModal';
import SignUpModal from '../Auth/SignUpModal';
import { toast } from 'sonner';
import { SignInCredentials } from '../../types/auth';

const Home = () => {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [signInCredentials, setSignInCredentials] = useState<SignInCredentials>();
  const auth = useRecoilValue(userState);
  const setUserState = useSetRecoilState(userState);

  const handleSwitchToSignUp = () => {
    setIsSignInModalOpen(false);
    setIsSignUpModalOpen(true);
    setSignInCredentials(undefined);
  };

  const handleSwitchToSignIn = (credentials?: SignInCredentials) => {
    setIsSignUpModalOpen(false);
    setIsSignInModalOpen(true);
    if (credentials) {
      setSignInCredentials(credentials);
    }
  };

  const handleUploadClick = () => {
    if (!auth.isAuthenticated) {
      toast.error('Please sign in to upload videos', {
        action: {
          label: 'Sign In',
          onClick: () => setIsSignInModalOpen(true)
        }
      });
      return;
    }
    document.getElementById('video-upload')?.click();
  };

  const handleSignOut = () => {
    setUserState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    toast.success('Signed out successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text"
          >
            SyncStream
          </motion.div>
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsJoinModalOpen(true)}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Join Room
            </motion.button>
            {auth.isAuthenticated ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignOut}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-full"
              >
                Sign Out
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSignInModalOpen(true)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Sign In
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSignUpModalOpen(true)}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-full"
                >
                  Sign Up
                </motion.button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-32 pb-20">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Watch Together, <br/>Anywhere
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Seamlessly transcode and stream your videos across all devices with synchronized playback.
          </p>
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg flex items-center gap-2"
            >
              Create Room <ArrowRightIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Upload Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24 bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl"
        >
          <h2 className="text-2xl font-semibold mb-6">Upload Your Video</h2>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
            <input
              type="file"
              className="hidden"
              id="video-upload"
              accept="video/*"
            />
            <label
              htmlFor="video-upload"
              onClick={(e) => {
                if (!auth.isAuthenticated) {
                  e.preventDefault();
                  handleUploadClick();
                }
              }}
              className="cursor-pointer flex flex-col items-center"
            >
              <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-300">
                {auth.isAuthenticated 
                  ? "Drag and drop your video here, or click to browse"
                  : "Sign in to upload your videos"}
              </p>
              <p className="text-sm text-gray-500 mt-2">Supports MP4, MOV, AVI formats</p>
            </label>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-24 text-center"
        >
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Create Room", desc: "Sign up and create your viewing room" },
              { step: "2", title: "Upload Video", desc: "Upload your video in any format" },
              { step: "3", title: "Share Code", desc: "Share your room code with friends" },
              { step: "4", title: "Watch Together", desc: "Enjoy synchronized playback" }
            ].map((item) => (
              <div key={item.step} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl">
                <div className="text-4xl font-bold text-blue-400 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-md py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                SyncStream
              </h3>
              <p className="text-gray-400">
                Watch videos together, perfectly synchronized across all devices.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Home</a></li>
                <li><a href="#" className="hover:text-white">Create Room</a></li>
                <li><a href="#" className="hover:text-white">Join Room</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2025 SyncStream. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <JoinRoomModal 
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSwitchToSignUp={handleSwitchToSignUp}
        initialCredentials={signInCredentials}
      />
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSwitchToSignIn={handleSwitchToSignIn}
      />
    </div>
  );
};

export default Home;

