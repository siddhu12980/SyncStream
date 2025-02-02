from tasks import test_task, process_video, test_s3_download_task, test_local_transcode_task
import uuid
import os
import time
from pathlib import Path

def test_video_processing(video_id: str,s3_video_url: str):
    print("Starting video processing test...")
    
    # Test video URL from S3 (replace with your actual S3 path)
    
    # s3_video_url = "path/to/your/test/video.mp4"  # Replace with actual S3 path
  
    print(f"Submitting video processing task...")
    print(f"Video ID: {video_id}")
    print(f"S3 URL: {s3_video_url}")
    
    # Submit the task
    result = process_video.delay(video_id, s3_video_url)
    
    print(f"Taskmpeg.input('input.mp4') submitted with id: {result.id}")
    print("Waiting for results...")
    
    # Poll for status
    while not result.ready():
        print("Processing... Please wait...")
        time.sleep(5)
    
    # Get the final result
    task_result = result.get()
    
    
    print("\nTask completed!")
    print("\nResult details:")
    print(f"Status: {task_result['status']}")
    
    if task_result['status'] == 'success':
        print(task_result)
        print("\nTranscoded versions:")
        
        # for resolution, url in task_result['transcoded_urls'].items():
        #     print(f"  {resolution}: {url}")
    else:
        print(f"Error: {task_result['error']}")

def test_basic_celery():
    print("Testing basic Celery functionality...")
    result = test_task.delay(2)
    print(f"Basic test task submitted with id: {result.id}")
    task_result = result.get()
    print("Basic test completed:", task_result)



def test_s3_download(obj_key: str):
    print("Testing S3 download functionality...")
    print(f"Object Key: {obj_key}")
    
    # Submit the download task
    result = test_s3_download_task.delay(obj_key)
    print(f"Download task submitted with id: {result.id}")
    
    # Wait for result
    task_result = result.get()
    
    if task_result['status'] == 'success':
        print(f"\nDownload successful!")
        print(f"File size: {task_result['file_size']} bytes")
        print(f"File path: {task_result['local_path']}")
    else:
        print(f"\nDownload failed!")
        print(f"Error: {task_result['error']}")

def test_local_transcode():
    print("\nTesting local video transcoding...")
    
    # Submit the transcode task
    result = test_local_transcode_task.delay('480p')  # Test with 480p resolution
    print(f"Transcode task submitted with id: {result.id}")
    
    # Wait for result
    task_result = result.get()
    
    if task_result['status'] == 'success':
        print("\nTranscode successful!")
        for format, info in task_result['results'].items():
            print(f"\n{format.upper()}:")
            print(f"  Path: {info['path']}")
            print(f"  Size: {info['size']} bytes")
    else:
        print("\nTranscode failed!")
        print(f"Error: {task_result['error']}")

if __name__ == "__main__":
    # First test basic Celery functionality
    # test_basic_celery()
    
    # Then test video processing
    print("\n" + "="*50 + "\n")
    
    
    # Test S3 download
    obj_key = "e9b7bb79-0304-496f-94e9-a40da877c05c/b4ff6_complete-test-1"
    # test_s3_download(obj_key) 
    id ='72982a4f-5f81-4d4a-a9d1-4d60b5df9885'
    
    test_video_processing(id,obj_key)
    
    # Test local transcoding
    print("\n" + "="*50 + "\n")
    # test_local_transcode() 