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


from backend.server.model.model import ProcessingStatus, VideoTask
from backend.server.db.db import engine

from sqlmodel import Session

# Redis configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = os.getenv('REDIS_PORsT', '6379')

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


# Add resolution presets (keeping only 480p and 720p)
RESOLUTION_PRESETS = {
    '720p': {
        'size': '1280x720',
        'video_bitrate': '2500k',
        'audio_bitrate': '128k'
    },
    '480p': {
        'size': '854x480',
        'video_bitrate': '1500k',
        'audio_bitrate': '128k'
    },
    '360p': {
        'size': '640x360',
        'video_bitrate': '800k',
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

        # Verify file type using python-magic
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

def transcode_video(input_path: str, output_path: str, format: str, resolution: str = '720p'):
    
    try:
        # Verify input file exists and has content
        input_file = Path(input_path)
        if not input_file.exists():
            raise Exception(f"Input file does not exist: {input_path}")
        if input_file.stat().st_size == 0:
            raise Exception(f"Input file is empty: {input_path}")
        
        
        print(f"Transcoding video from {input_path} to {output_path} in {format} format and {resolution} resolution")   

        stream = ffmpeg.input(input_path)
        
        preset = RESOLUTION_PRESETS[resolution]
        
        if format == 'mp4':
            stream = ffmpeg.output(stream, output_path,
                                 vcodec='libx264',
                                 acodec='aac',
                                 video_bitrate=preset['video_bitrate'],
                                 audio_bitrate=preset['audio_bitrate'],
                                 s=preset['size'],  # resolution
                                 preset='medium',  # encoding preset
                                 movflags='faststart')  # web playback optimization
        elif format == 'webm':
            stream = ffmpeg.output(stream, output_path,
                                 vcodec='libvpx-vp9',
                                 acodec='libopus',
                                 video_bitrate=preset['video_bitrate'],
                                 audio_bitrate=preset['audio_bitrate'],
                                 s=preset['size'],  # resolution
                                 quality='good',
                                 speed=2)  # encoding speed vs quality tradeoff
        
        # Get the ffmpeg command for debugging
        cmd = ffmpeg.compile(stream)
        print(f"FFmpeg command: {' '.join(cmd)}")
        
        # Run the ffmpeg command and capture any error output
        try:
            ffmpeg.run(stream, overwrite_output=True, capture_stderr=True)
            print(f"FFmpeg command executed successfully for {input_path} to {output_path} in {format} format and {resolution} resolution")
     

        except ffmpeg.Error as e:
            print(f"FFmpeg stderr:\n{e.stderr.decode()}")
            raise Exception(f"FFmpeg error: {e.stderr.decode()}")
            
        # Verify output file exists and has content
        output_file = Path(output_path)
        
        if not output_file.exists():
            raise Exception(f"Output file was not created: {output_path}")
        if output_file.stat().st_size == 0:
            raise Exception(f"Output file is empty: {output_path}")
        
        print(f"Transcoded video to {output_path}")
        return True
    
    except Exception as e:
        print(f"Error transcoding video: {str(e)}")
        return False


@celery_app.task(name="process_video")
def process_video(video_id: str, video_url: str):
    try:
        # Update status to processing
        update_video_status(video_id, ProcessingStatus.processing)
        
        #this is to test if db is working or not
        # Create video processing directory
        video_dir = Path(f"video/{video_id}")
        video_dir.mkdir(parents=True, exist_ok=True)
        
        # Set base local path (without extension)
        base_input_path = str(video_dir / "input_video")
        
        print(f"Attempting to download video: {video_url}")
        
        # Download video from S3 with verification
        if not download_from_s3(video_url, base_input_path):
            raise Exception("Failed to download video from S3")
            
        # Find the actual downloaded video file with extension
        video_files = list(video_dir.glob("input_video.*"))
        if not video_files:
            raise Exception("Downloaded video file not found")
            
        input_path = str(video_files[0])
        print(f"Successfully downloaded video to: {input_path}")

        # Process only MP4 format with multiple resolutions
        resolutions = ['720p', '480p', '360p']
        transcoded_urls = {}
        
        for resolution in resolutions:
            output_path = str(object=video_dir / f"output_{resolution}.mp4")
            
            # Transcode video
            if not transcode_video(input_path, output_path, 'mp4', resolution):
                raise Exception(f"Failed to transcode video to {resolution}")
            
            # Upload transcoded video
            s3_key = f"{video_id}/{resolution}/transcoded.mp4"
            if not upload_to_s3(output_path, s3_key):
                raise Exception(f"Failed to upload transcoded {resolution} video")
            
            transcoded_urls[resolution] = s3_key

        # Update status to completed
        update_video_status(video_id, ProcessingStatus.completed)
        
        return {
            "status": "success",
            "video_id": video_id,
            "transcoded_urls": transcoded_urls,
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


@celery_app.task(name="test_s3_download")
def test_s3_download_task(obj_key: str):
    try:
        # Create video processing directory
        video_dir = Path(f"video/{obj_key}")
        video_dir.mkdir(parents=True, exist_ok=True)
        
        # Set base local path (without extension)
        base_local_path = str(video_dir / "input_video")
        
        print(f"Attempting to download {obj_key}")
        
        # Use existing download function which will append the correct extension
        if download_from_s3(obj_key, base_local_path):
            # Find the actual file that was created (with extension)
            video_files = list(video_dir.glob("input_video.*"))
            if not video_files:
                raise Exception("Downloaded file not found")
                
            actual_path = video_files[0]  # Get the first matching file
            file_size = actual_path.stat().st_size
            
            return {
                "status": "success",
                "file_size": file_size,
                "local_path": str(actual_path),
                "completed_at": datetime.now().isoformat()
            }
        else:
            return {
                "status": "error",
                "error": "Failed to download file from S3"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

# Keep the original test_task for basic Celery testing
@celery_app.task(name="test_task")
def test_task(wait_time: int = 4):
    print(f"Starting test task, will sleep for {wait_time} seconds")
    for i in range(wait_time):
        time.sleep(1)
        print(f"Processing... {i+1}/{wait_time} seconds")
    print("Test task completed!")
    return {
        "status": "success",
        "message": f"Slept for {wait_time} seconds",
        "completed_at": datetime.now().isoformat()
    }

@celery_app.task(name="test_local_transcode")
def test_local_transcode_task(resolution: str = '720p'):
    try:
        input_path = "video/any/input_video.mp4"
        if not os.path.exists(input_path):
            raise Exception(f"Test video not found at {input_path}")

        # Create output directory
        output_dir = Path("video/any/output")
        output_dir.mkdir(parents=True, exist_ok=True)

        # Test transcoding to both formats
        formats = ['mp4']
        results = {}

        for format in formats:
            output_path = str(output_dir / f"output_{resolution}.{format}")
            print(f"Transcoding to {format} at {resolution}...")
            
            if transcode_video(input_path, output_path, format, resolution):
                file_size = Path(output_path).stat().st_size
                results[format] = {
                    'path': output_path,
                    'size': file_size
                }
            else:
                raise Exception(f"Failed to transcode to {format}")

        return {
            "status": "success",
            "results": results,
            "completed_at": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"Error in test transcode: {str(e)}")
        return {
            "status": "error",
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
    