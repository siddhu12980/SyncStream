from model.model import VideoTaskCreateModel
from model.model import VideoTask
from fastapi import HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

class VideoService:
    
    async def create_video_task(self,video:VideoTaskCreateModel, session: AsyncSession):
        print("Creating video task...", video)
        
        new_video_task = VideoTask(
            video_url=video.video_url,
            title=video.title,
            # created_by=video.created_by,
            # owner=video.created_by,
        )
        
        try:
            session.add(new_video_task)
            session.commit()
            session.refresh(new_video_task)
            
            return {
                "id": new_video_task.id,
                "title": new_video_task.title,
                "description": new_video_task.description,
                "is_active": new_video_task.is_active
            }
            
        except Exception as e:
            session.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Error creating video task: {str(e)}"
            )
        
    
    
