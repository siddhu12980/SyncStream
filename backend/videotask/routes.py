from fastapi import HTTPException,APIRouter,Request

from fastapi.responses import JSONResponse
import time
from auth.util import decode_token

from fastapi import Depends
from .service import VideoService

video_router = APIRouter()
video_Service = VideoService()



    

@video_router.post("/")
async def create_video_task():
    return {"message":"Create video"}

