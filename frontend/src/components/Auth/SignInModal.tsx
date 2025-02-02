import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useSignIn } from '../../hooks/useAuth';
import { SignInCredentials } from '../../types/auth';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  initialCredentials?: SignInCredentials;
}

const SignInModal = ({ isOpen, onClose, onSwitchToSignUp, initialCredentials }: SignInModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signIn = useSignIn(onClose);

  useEffect(() => {
    if (initialCredentials) {
      setEmail(initialCredentials.email);
      setPassword(initialCredentials.password);
    }
  }, [initialCredentials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    signIn.mutate({ email, password });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
                <h3 className="text-xl font-semibold">Sign In</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold"
                  type="submit"
                >
                  Sign In
                </motion.button>
              </form>

              <div className="mt-4 text-center text-gray-400">
                Don't have an account?{' '}
                <button
                  onClick={onSwitchToSignUp}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SignInModal; 