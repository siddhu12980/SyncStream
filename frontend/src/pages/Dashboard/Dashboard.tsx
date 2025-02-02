import DashboardLayout from '../../components/Layout/DashboardLayout';
import VideoList from '../../components/Video/VideoList';
import RoomList from '../../components/Room/RoomList';
import { useRecoilValue } from 'recoil';
import { userState } from '../../store/userStore';
import { useLocation } from 'react-router-dom';

const Dashboard = () => {
  const auth = useRecoilValue(userState);
  const location = useLocation();
  const isRoomsView = location.pathname === '/dashboard/rooms';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome, {auth.user?.username}!</h1>
          <p className="text-gray-400">
            {isRoomsView 
              ? "Manage your viewing rooms from here."
              : "Manage your videos from here."}
          </p>
        </div>

        {isRoomsView ? <RoomList /> : <VideoList />}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard; 