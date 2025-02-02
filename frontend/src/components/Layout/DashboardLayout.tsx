import { motion } from 'framer-motion';
import { useRecoilValue } from 'recoil';
import { userState } from '../../store/userStore';
import { Navigate } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const auth = useRecoilValue(userState);
  const setUserState = useSetRecoilState(userState);

  if (!auth.isAuthenticated) {
    return <Navigate to="/" />;
  }

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
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-black/50 backdrop-blur-md p-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-12"
        >
          SyncStream
        </motion.div>

        <nav className="space-y-6">
          <a 
            href="/dashboard" 
            className="block text-gray-300 hover:text-white"
          >
            Videos
          </a>
          <a 
            href="/dashboard/rooms" 
            className="block text-gray-300 hover:text-white"
          >
            Rooms
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout; 