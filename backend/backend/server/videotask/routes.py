import http.client
from fastapi import APIRouter,Request,HTTPException

from fastapi import Depends
from .service import VideoService
from backend.server.db.db import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from backend.server.model.model import VideoTaskCreateModel,TaskResponseModel,ProcessingStatus, VideoTaskUpdateModel
from backend.server.auth.util import create_presigned_post
import uuid
import json
import http

video_router = APIRouter()
video_Service = VideoService()


@video_router.post("/")
async def create_video_task(req: Request , video:VideoTaskCreateModel ,session:AsyncSession = Depends(get_session)):
   
    print(req.state.user)
    
    if (req.state.user is None):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized" ) 
        
    if (req.state.user.id is None):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized" )
        
    if(video.title == ""):
        raise HTTPException(
            status_code=400,
            detail="Title is required" )
        
        
    id = str(req.state.user.id)+"/"+str(uuid.uuid4())[0:5]+"_" + video.title
    
    print("Object Name : ",id)
    
    res =await create_presigned_post(id)
    
    print("Res Dine",res)
    
    if ( res is None):
        raise HTTPException(
            status_code=500,
            detail="Error creating video task" )
        
    data =await video_Service.create_video_task(video,session,req.state.user.id,key=id)

    return {
        "id": data["id"],
        "fields": res["fields"],
        "url": res["url"],
        "data": data
    }
    

@video_router.get("/")
async def read_video_tasks(req:Request,session:  AsyncSession = Depends(get_session)):
    # return await video_Service.read_video_tasks(session)
    
    print("Reading video tasks...")
    
    if (req.state.user is None):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized" )
        
    if (req.state.user.id is None):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized" )

    return await video_Service.get_all_tasks(session,req.state.user.id)


@video_router.get("/{id}")
async def read_video_task(req:Request,id:str,session:  AsyncSession = Depends(get_session)):
    return await video_Service.read_video_task(session,id)


@video_router.put("/{id}")
async def update_video_task(
    req: Request,
    id: str,
    update_data: VideoTaskUpdateModel,
    session: AsyncSession = Depends(get_session)
):
    if req.state.user is None or req.state.user.id is None:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )
    
    return await video_Service.update_video_task(
        session=session,
        task_id=id,
        status=update_data.status
    )

@video_router.delete("/{id}")
async def delete_video_task(
    req: Request,
    id: str,
    session: AsyncSession = Depends(get_session)
):
    if req.state.user is None or req.state.user.id is None:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )
    
    return await video_Service.delete_video_task(
        session=session,
        task_id=id,
        user_id=req.state.user.id
    )


    
    
    
        

    
    
