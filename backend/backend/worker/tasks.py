from celery import Celery
from datetime import datetime
import os
import time
import boto3
import ffmpeg
from pathlib import Path
from botocore.exceptions import ClientError
import mimetypes
import magic
import shutil


from backend.server.model.model import ProcessingStatus, VideoTask
from backend.server.db.db import engine

from sqlmodel import Session

# Redis configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = os.getenv('REDIS_PORT', '6379')

# S3 configuration
S3_BUCKET = os.getenv('S3_BUCKET', 'sidd-bucket-fast-api')

# AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY', '')
# AWS_SECRET_KEY = os.getenv('AWS_SECRET_KEY', '')

# Initialize S3 client
s3_client = boto3.client('s3')

BROKER_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/0'
BACKEND_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/1'

# Initialize Celery
celery_app = Celery(
    'video_tasks',
    broker=BROKER_URL,
    backend=BACKEND_URL
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)


# Update resolution presets for HLS
HLS_PRESETS = {
    '1080p': {
        'resolution': '1920x1080',
        'bitrate': '5000k',
        'audio_bitrate': '192k'
    },
    '720p': {
        'resolution': '1280x720',
        'bitrate': '2500k',
        'audio_bitrate': '128k'
    },
    '480p': {
        'resolution': '854x480',
        'bitrate': '1200k',
        'audio_bitrate': '128k'
    },
    '360p': {
        'resolution': '640x360',
        'bitrate': '800k',
        'audio_bitrate': '96k'
    }
}


def update_video_status(video_id: str, status: ProcessingStatus):
    print(f"Updating video {video_id} status to: {status}")
    try:
        with Session(engine) as session:
            video_task = session.get(VideoTask, video_id)
            if video_task:
                video_task.status = status
                video_task.updated_at = datetime.now().isoformat()
                session.add(video_task)
                session.commit()
                print(f"Successfully updated video status to {status}")
            else:
                print(f"Video task {video_id} not found")
    except Exception as e:
        print(f"Error updating video status: {str(e)}")


def download_from_s3(OBJ_KEY: str, local_path: str):
    try:
        # First, get the object's metadata
        try:
            response = s3_client.head_object(Bucket=S3_BUCKET, Key=OBJ_KEY)
            content_type = response.get('ContentType', '')
            print(f"Content type: {content_type}")
        except ClientError as e:
            print(f"Error getting object metadata: {str(e)}")
            return False

        # Get file extension from content type or original key
        file_ext = None
        if content_type:
            file_ext = mimetypes.guess_extension(content_type)
            print(f"File extension: {file_ext}")
            
        if not file_ext and '.' in OBJ_KEY:
            file_ext = os.path.splitext(OBJ_KEY)[1]
            print(f"File extension from key: {file_ext}")
            
        if not file_ext:
            file_ext = '.mp4'  # Default to .mp4 if no extension found
            print(f"File extension defaulted to: {file_ext}")

        # Append extension to local path if it doesn't have one
        if not os.path.splitext(local_path)[1]:
            local_path = f"{local_path}{file_ext}"

        # Download the file
        s3_client.download_file(S3_BUCKET, OBJ_KEY, local_path)
        
        # Verify the file exists and has content
        local_file = Path(local_path)
        if not local_file.exists():
            raise Exception("Downloaded file does not exist")
        
        if local_file.stat().st_size == 0:
            raise Exception("Downloaded file is empty")

        try:
            # First try with mime=True
            file_type = magic.from_file(filename=local_path, mime=True)
            
            print(f"File type: {file_type}")    
            
        except TypeError:
            file_type = magic.from_file(filename=local_path, mime=True)
            
        print(f"Detected file type: {file_type}")
        
        if not file_type.startswith('video/'):
            raise Exception(f"Downloaded file is not a video. Detected type: {file_type}")
            
        print(f"Downloaded video from S3 to {local_path}")
        print(f"File size: {local_file.stat().st_size} bytes")
        print(f"File type: {file_type}")
        
        return True
    
    except ClientError as e:
        print(f"Error downloading from S3: {str(e)}")
        return False
    except Exception as e:
        print(f"Error processing download: {str(e)}")
        return False

def upload_to_s3(local_path: str, s3_key: str):
    """Upload video to S3"""
    try:
        s3_client.upload_file(local_path, S3_BUCKET, s3_key)
        return True
    except ClientError as e:
        print(f"Error uploading to S3: {str(e)}")
        return False


def create_master_playlist(resolutions: list, base_path: str):
    """Create master.m3u8 that points to resolution-specific playlists"""
    master_content = "#EXTM3U\n"
    
    for res in resolutions:
        preset = HLS_PRESETS[res]
        bandwidth = int(preset['bitrate'].replace('k', '000'))
        
        master_content += f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={preset['resolution']}\n"
        master_content += f"{res}/playlist.m3u8\n"
    
    with open(f"{base_path}/master.m3u8", "w") as f:
        f.write(master_content)

def transcode_to_hls(input_path: str, output_dir: str, resolution: str) -> bool:
    """
    Directly transcode video to HLS format for a specific resolution
    No intermediate files, just straight to HLS
    """
    try:
        preset = HLS_PRESETS[resolution]
        res_dir = f"{output_dir}/{resolution}"
        os.makedirs(res_dir, exist_ok=True)
        
        print(f"Processing {resolution} in directory: {res_dir}")
        
        stream = (
            ffmpeg
            .input(input_path)
            .output(
                f"{res_dir}/playlist.m3u8",
                vf=f"scale={preset['resolution']}",
                **{
                    'c:v': 'libx264',           # Video codec
                    'c:a': 'aac',               # Audio codec
                    'b:v': preset['bitrate'],    # Video bitrate
                    'b:a': preset['audio_bitrate'], # Audio bitrate
                    'f': 'hls',                  # Format is HLS
                    'hls_time': 10,              # Segment duration
                    'hls_playlist_type': 'vod',  # Video on demand
                    'hls_segment_filename': f"{res_dir}/segment_%03d.ts",
                    'hls_list_size': 0,          # Keep all segments
                    'hls_flags': 'independent_segments'
                }
            )
        )
        
        # Log the command for debugging
        cmd = ffmpeg.compile(stream)
        print(f"FFmpeg command for {resolution}: {' '.join(cmd)}")
        
        ffmpeg.run(stream, overwrite_output=True, capture_stderr=True)
        print(f"Successfully processed {resolution}")
        return True
        
    except ffmpeg.Error as e:
        print(f"FFmpeg error for {resolution}: {e.stderr.decode() if e.stderr else str(e)}")
        return False
    except Exception as e:
        print(f"Error processing {resolution}: {str(e)}")
        return False

def upload_hls_to_s3(local_dir: str, video_id: str) -> bool:
    """Upload HLS content to S3 with organized structure"""
    try:
        s3_base_key = f"videos/{video_id}"
        
        # Upload master playlist
        s3_client.upload_file(
            f"{local_dir}/master.m3u8",
            S3_BUCKET,
            f"{s3_base_key}/master.m3u8",
            ExtraArgs={'ContentType': 'application/x-mpegURL'}
        )

        # Upload resolution-specific files
        for resolution in HLS_PRESETS.keys():
            res_dir = f"{local_dir}/{resolution}"
            if not os.path.exists(res_dir):
                continue

            # Upload all files in resolution directory
            for file in os.listdir(res_dir):
                local_file = f"{res_dir}/{file}"
                s3_key = f"{s3_base_key}/{resolution}/{file}"
                
                content_type = ('application/x-mpegURL' if file.endswith('.m3u8') 
                              else 'video/MP2T')
                
                s3_client.upload_file(
                    local_file,
                    S3_BUCKET,
                    s3_key,
                    ExtraArgs={'ContentType': content_type}
                )

        return True
    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        return False

@celery_app.task(name="process_video")
def process_video(video_id: str, video_obj_key: str):
    """Main video processing task"""
    try:
        update_video_status(video_id, ProcessingStatus.processing)
        
        # Setup directories
        video_dir = Path(f"video/{video_id}")
        video_dir.mkdir(parents=True, exist_ok=True)
        
        # Download video
        input_path = str(video_dir / "input_video")
        if not download_from_s3(video_obj_key, input_path):
            raise Exception("Failed to download video")
            
        # Find downloaded file
        video_files = list(video_dir.glob("input_video.*"))
        if not video_files:
            raise Exception("Downloaded video file not found")
        
        input_video = str(video_files[0])
        output_dir = str(video_dir / "output")
        os.makedirs(output_dir, exist_ok=True)
        
        # Process each resolution directly to HLS
        processed_resolutions = []
        for resolution in HLS_PRESETS.keys():
            if transcode_to_hls(input_video, output_dir, resolution):
                processed_resolutions.append(resolution)
                print(f"Processed {resolution} successfully")
            else:
                print(f"Failed to process {resolution}")
        
        if not processed_resolutions:
            raise Exception("Failed to process any resolution")
        
        # Create and upload
        create_master_playlist(processed_resolutions, output_dir)
        if not upload_hls_to_s3(output_dir, video_id):
            raise Exception("Failed to upload to S3")
        
        # Cleanup and update status
        shutil.rmtree(str(video_dir))
        update_video_status(video_id, ProcessingStatus.completed)
        
        return {
            "status": "success",
            "video_id": video_id,
            "hls_url": f"videos/{video_id}/master.m3u8",
            "resolutions": processed_resolutions,
            "completed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        update_video_status(video_id, ProcessingStatus.failed)
        return {
            "status": "error",
            "video_id": video_id,
            "error": str(e)
        }



if __name__ == "__main__":
    # To start the Celery worker, run one of these commands from the backend directory:
    # Development with detailed logging:
    #   celery -A worker.tasks worker --loglevel=DEBUG
    # 
    # Production with info logging:
    #   celery -A worker.tasks worker --loglevel=INFO
    #
    # With autoreload for development:
    #   watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- celery -A worker.tasks worker --loglevel=INFO

    print("Celery worker started")  
    celery_app.start()
    