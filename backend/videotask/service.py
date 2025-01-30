from model.model import VideoTaskCreateModel
from model.model import VideoTask
from fastapi import HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

class VideoService:
    
    async def create_video_task(self,video:VideoTaskCreateModel, session: AsyncSession,id:str, key:str):
        print("Creating video task...", video)
        
        new_video_task = VideoTask(
            video_url=key,
            title=video.title,
            created_by=id
        )
        
        try:
            session.add(new_video_task)
            session.commit()
            session.refresh(new_video_task)
            
            print(new_video_task)

            return {
                "id": new_video_task.id,
                "title": new_video_task.title,
                "description": new_video_task.description,
            }
            
        except Exception as e:
            session.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Error creating video task: {str(e)}"
            )
        
    
    
