import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { VideoPlayer } from './VideoPlayer';
import axios1 from '../../config/axios';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ChatBox } from './ChatBox';
import { userState } from '../../store/userStore';
import { useRecoilValue } from 'recoil';

interface Room {
  id: string;
  name: string;
  description: string;
  video_key: string | null;
  created_at: string;
  updated_at: string;   
  created_by: string;
}

export default function RoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useRecoilValue(userState);

  if (!auth.user) {
    navigate('/', { replace: true });
    return null;
  }

  const { data: room, isLoading, isError,isSuccess } = useQuery({
    queryKey: ['room', id],
    queryFn: async () => {
      if (!id) throw new Error('No room ID');
      const response = await axios1.get(`/room/${id}`);
      return response.data as Room;
    },
    staleTime: 1000 * 60,
    retry: false,
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="animate-pulse h-4 w-24 bg-gray-700 rounded mb-4"></div>
        <div className="animate-pulse aspect-video bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  if (isSuccess) {
    if (!room?.video_key) {
      navigate('/', { replace: true });
    }
  }

  if (isError || !room) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Rooms
        </button>

        <div className="flex gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-4">{room.name}</h1>
            {room.description && (
              <p className="text-gray-400 mb-6">{room.description}</p>
            )}

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {room.video_key && <VideoPlayer videoUrl={room.video_key} />}
            </div>
          </div>

          <ChatBox roomId={room.id}  currentUserId={auth.user!.id}/>
        </div>
      </div>
    </div>
  );
} 