import http.client
from fastapi import APIRouter,Request,HTTPException

from fastapi import Depends
from .service import VideoService
from db.db import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from model.model import VideoTaskCreateModel,TaskResponseModel
from auth.util import create_presigned_post
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
    
    res =await  create_presigned_post(id)
    
    print("Res Dine",res)
    
    if ( res is None):
        raise HTTPException(
            status_code=500,
            detail="Error creating video task" )
        
    data =await video_Service.create_video_task(video,session,req.state.user.id,key=id)
    
    # {
    #     "id": id,
    #     "fields": res["fields"],
    #     "url": res["url"],
    #     "data": data
    # }
    
# return that as json response 

    print("Hewr")
    
    print(
        id=data["id"],
        fields=res["fields"],
        url=res["url"],
        data=data
    )
    
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
        
    id = str(uuid.uuid4())[0:10]+"_" + req.state.user.id
    
    
    print("Object Name : ",id)
    
    return id
    
        

    
    
