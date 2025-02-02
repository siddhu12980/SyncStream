import { ProcessingStatus } from './video';

export enum RoomStatus {
  CREATED = 'created',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted'
}

export interface Room {
  id: string;
  name: string;
  description: string;
  status: RoomStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  video_keys: string[];
}

export interface Video {
  id: string;
  title: string;
  video_url: string;
  status: ProcessingStatus;
  created_at: string;
}

export interface CreateRoomRequest {
  name: string;
  description: string;
}

export interface UploadVideoRequest {
  title: string;
  roomId: string;
}

export interface AddVideoToRoomRequest {
  video_key: string;
} 