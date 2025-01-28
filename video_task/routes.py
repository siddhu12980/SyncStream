from fastapi import HTTPException,APIRouter,status

from fastapi.responses import JSONResponse


from fastapi import Depends
from .service import VideoService

video_router = APIRouter()
video_Service = VideoService()

@video_router.post("/")
async def create_video_task():
    return {"message":"Create video"}