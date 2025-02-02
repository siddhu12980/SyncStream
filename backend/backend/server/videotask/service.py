from backend.server.model.model import VideoTaskCreateModel, VideoTaskResponseModel
from backend.server.model.model import VideoTask, ProcessingStatus
from fastapi import HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime
from sqlmodel import select
# from worker.tasks import process_video

class VideoService:
    
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
            
            session.delete(task)
            session.commit()
            
            return {"message": "Video task deleted successfully" , "task_id":task.id}
            
        except HTTPException as he:
            await session.rollback()
            raise he
        except Exception as e:
            await session.rollback()
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

