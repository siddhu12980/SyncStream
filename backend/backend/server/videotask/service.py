from backend.server.model.model import VideoTaskCreateModel, VideoTaskResponseModel
from backend.server.model.model import VideoTask, ProcessingStatus
from fastapi import HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime
from sqlmodel import select
from botocore.exceptions import ClientError
import boto3
# from worker.tasks import process_video

class VideoService:
    
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = 'sidd-bucket-fast-api'

    async def create_video_task(self,video:VideoTaskCreateModel, session: AsyncSession,id:str, key:str):
        print("Creating video task...", video)
        
        new_video_task = VideoTask(
            video_url=key,
            title=video.title,
            created_by=id,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            status=ProcessingStatus.created
        )
        
        try:
            session.add(new_video_task)
            session.commit()
            session.refresh(new_video_task)
            
        
            # process_video.delay(str(new_video_task.id), new_video_task.video_url)
            
            return {
                "id": new_video_task.id,
                "video_url": new_video_task.video_url,
                "status": new_video_task.status,
                "created_by": new_video_task.created_by,
                "created_at": new_video_task.created_at,
                "title": new_video_task.title
            }
            
            
            
        except Exception as e:
            await session.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Error creating video task: {str(e)}"
            )
        
    async def update_video_task(self, session: AsyncSession, task_id: str, status: ProcessingStatus) -> VideoTaskResponseModel:
        try:
            task =  session.get(VideoTask, task_id)
            
            if not task:
                raise HTTPException(
                    status_code=404,
                    detail="Video task not found"
                )
            
            task.status = status
            task.updated_at = datetime.now().isoformat()
            
            session.add(task)
            session.commit()
            session.refresh(task)
            
            return VideoTaskResponseModel(
                id=task.id,
                video_url=task.video_url,
                status=task.status,
                created_by=task.created_by,
                created_at=task.created_at
            )
            
        except Exception as e:
            await session.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error updating video task: {str(e)}"
            )
    
    async def delete_video_task(self, session: AsyncSession, task_id: str, user_id: str):
        try:
            task =  session.get(VideoTask, task_id)
            
            if not task:
                raise HTTPException(
                    status_code=404,
                    detail="Video task not found"
                )
            
            if task.created_by != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to delete this task"
                )

            # Check if original video object exists in S3
            try:
                self.s3_client.head_object(Bucket=self.bucket_name, Key=task.video_url)
                # Object exists, delete it
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=task.video_url)
                
                # Check if folder is empty after deletion
                processed_folder = f"{task.video_url.rsplit('/', 1)[0]}/"  # Get the folder path
                
                response = self.s3_client.list_objects_v2(
                    Bucket=self.bucket_name,
                    Prefix=processed_folder
                )
                
                print("--------------------------------")
                print("before deleting folder", response)
                print("--------------------------------")
                
                # If folder exists but is empty (only contains the folder object itself)
                if 'Contents' not in response or len(response['Contents']) <= 1:
                    self.s3_client.delete_object(
                        Bucket=self.bucket_name,
                        Key=processed_folder
                    )
          
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    # Object doesn't exist in S3, just continue
                    pass
                else:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error checking/deleting S3 object: {str(e)}"
                    )
            
            # Check and delete processed videos folder
            try:
                # Define the root folder for processed videos
                processed_folder = f"videos/{task_id}/"
                
                # List all objects with this prefix (recursive)
                paginator = self.s3_client.get_paginator('list_objects_v2')
                
                
                print("Paginator Response",paginator)
                
                objects_to_delete = []
                
                # Paginate through all objects in case there are more than 1000
                for page in paginator.paginate(Bucket=self.bucket_name, Prefix=processed_folder):
                    if 'Contents' in page:
                        # Collect all objects in this folder and its subfolders
                        objects_to_delete.extend([{'Key': obj['Key']} for obj in page['Contents']])
                
                if objects_to_delete:
                    # S3 delete_objects can only handle 1000 objects at a time
                    for i in range(0, len(objects_to_delete), 1000):
                        batch = objects_to_delete[i:i + 1000]
                        self.s3_client.delete_objects(
                            Bucket=self.bucket_name,
                            Delete={'Objects': batch}
                        )
                        
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    # Folder doesn't exist, just continue
                    pass
                else:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error deleting processed videos folder: {str(e)}"
                    )
            
            # Delete from database
            session.delete(task)
            session.commit()
            
            return {"message": "Video task and associated files deleted successfully", "task_id": task.id}
            
        except Exception as e:
            session.rollback()
            
            raise HTTPException(
                status_code=500,
                detail=f"Error deleting video task: {str(e)}"
            )



    async def get_all_tasks(self, session: AsyncSession, user_id: str) -> list[VideoTaskResponseModel]:
        try:
            statement = select(VideoTask).where(VideoTask.created_by == user_id)
            result =  session.exec(statement)
            
            if (result is None):
                raise HTTPException(
                    status_code=404,
                    detail="Video task not found"
                )
                
            tasks = result.all()
            
            return [
                VideoTaskResponseModel(
                    id=task.id,
                    video_url=task.video_url,
                    status=task.status,
                    created_by=task.created_by,
                    created_at=task.created_at,
                    title=task.title
                ) for task in tasks
            ]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching video tasks: {str(e)}"
            )

