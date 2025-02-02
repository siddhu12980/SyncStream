export enum ProcessingStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Video {
  id: string;
  title: string;
  video_url: string;
  status: ProcessingStatus;
  created_at: string;
  created_by: string;
}

export interface VideoTask {
  id: string;
  video_url: string;
  status: ProcessingStatus;
  created_by: string;
  created_at: string;
  title: string;
}

export interface VideoUploadResponse {
  id: string;
  fields: {
    key: string;
    'x-amz-algorithm': string;
    'x-amz-credential': string;
    'x-amz-date': string;
    policy: string;
    'x-amz-signature': string;
  };
  url: string;
  data: VideoTask;
} 