from backend.worker.tasks import  process_video
import uuid
import os
import time
from pathlib import Path

def test_hls_video_processing(video_id: str, s3_video_url: str):
    """Test HLS video processing with multiple resolutions"""
    print("\n=== Testing HLS Video Processing ===")
    print(f"Video ID: {video_id}")
    print(f"S3 URL: {s3_video_url}")
    
    # Submit the task
    result = process_video.delay(video_id, s3_video_url)
    print(f"Task submitted with id: {result.id}")
    
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
        print(f"\nHLS Master Playlist URL: {task_result['hls_url']}")
        print("\nProcessed Resolutions:")
        for resolution in task_result['resolutions']:
            print(f"  - {resolution}")
            print(f"    Playlist: hls/{video_id}/{resolution}/{resolution}.m3u8")
        print(f"\nCompleted at: {task_result['completed_at']}")
    else:
        print(f"Error: {task_result['error']}")


if __name__ == "__main__":
    # Test parameters
    VIDEO_ID = "80f667e4-78d0-48bf-a3c7-377ab33480f8"  # Replace with your test video ID
    S3_VIDEO_URL = "b65caa56-1dec-47ca-b84e-5f522baaea9d/520d3_complete-test-5"
    
    # Uncomment tests you want to run
    # test_basic_celery()
    # test_s3_download(S3_VIDEO_URL)
    
    print("Starting test_hls_video_processing")
    print("Video ID: ", VIDEO_ID)
    print("S3 Video URL: ", S3_VIDEO_URL)
    
    test_hls_video_processing(VIDEO_ID, S3_VIDEO_URL)
    
    # Test local transcoding
    print("\n" + "="*50 + "\n")
    # test_local_transcode() 