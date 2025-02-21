from fastapi import FastAPI,HTTPException, WebSocket, WebSocketDisconnect, Query

from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session,select, and_

from backend.server.db.db import db
from fastapi import Request
from fastapi.responses import JSONResponse
from backend.server.auth.util import decode_token
from backend.server.model.model import User,VideoTask
from pydantic import BaseModel
from backend.server.user.routes import user_router
from backend.server.auth.router import auth_router
from backend.server.videotask.routes import video_router
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from backend.server.db.db import get_session
from backend.server.room.room_routes import router as room_router
from typing import Callable
from backend.server.public.public_routes import public_router
import json
from backend.server.yt import handle_request
import logging
from backend.worker.tasks import process_video
from .room.ws import handle_websocket


class MyFastAPI(FastAPI):
    pass

@asynccontextmanager
async def lifespan(app:  MyFastAPI):
    try:
         db.init_db()
         print("Visit: http://127.0.0.1:3080 for API")
         print("Visit: http://127.0.0.1:3080/docs for API documentation.")
         print()  
         yield 
    finally:
             print("\n🛑 Shutting down FastChain server...")



app = MyFastAPI(
    title="Simple Fast Api App",
    lifespan=lifespan,
    version="1.0.1"
)

# Define CORS settings
origins = [ 
    "http://localhost:5173",    # Your frontend dev server
    "http://127.0.0.1:5173",   # Alternative localhost
    "http://localhost:3000",    # Add any other origins you need
]

# Add CORS middleware with more specific configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # WARNING: Don't use in production
    allow_credentials=False,  # Must be False if allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)



logger = logging.getLogger(__name__)


logger = logging.getLogger(__name__)

@app.middleware("http")
async def auth_middleware(request: Request, call_next: Callable):
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path in [
        "/auth/login", 
        "/auth/signup",
        "/docs", 
        "/openapi.json", 
        "/favicon.ico",
        "/s3",
        "/ws",
        "/public/room",
        "/public/yt",
        "/api-docs",
        "/public/yt"
    ] or request.url.path.startswith("/public/room/"):  # Allow room ID lookups
        return await call_next(request)

    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise HTTPException(status_code=401, detail="No Authorization header")
            
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        if not token:
            raise HTTPException(status_code=401, detail="Empty token")
            
        try:
            token_data = decode_token(token)
            if not token_data:
                raise HTTPException(status_code=401, detail="Invalid token")
            print("Token data: ", token_data)
            user_id = token_data.get("user")
            if not user_id:
                raise HTTPException(status_code=401, detail="User ID missing from token")
                
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            raise HTTPException(status_code=401, detail="Token validation failed")
            
        try:
            print("Getting user from database...")
            
            with Session(db.engine) as session:
                
                id = user_id["user_id"]
                
                print("User ID: ", id)
                
                user = session.exec(select(User).where(User.id == id)).first()
                
                if not user:
                    raise HTTPException(status_code=401, detail="User not found")
                
                request.state.user = user
                print("User found: ", user)
                
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            raise HTTPException(status_code=500, detail="Database error")
            
        response = await call_next(request)
        return response
        
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    except Exception as e:
        logger.error(f"Unexpected error in auth middleware: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

@app.get("/")
def read_root():
    return {"Hello": "World"}



class S3Event(BaseModel):
    bucket_name: str
    object_key: str
    event_time: str
    event_type: str
    size: int

SECRET_KEY = "your-secret-key"

@app.post("/s3", status_code=200)
async def read_s3(request: Request, session: AsyncSession = Depends(get_session)):
    auth_header = request.headers.get("Authorization")
    
    if auth_header != SECRET_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid Authorization header")

    print("Auth passed")
    
    try:
        body = await request.body()
        data = json.loads(body)
        s3_event = S3Event(**data)
        
        print(f"\n Received S3 Event: {s3_event} \n")
        
        parts = s3_event.object_key.split("/")
        if len(parts) < 2:
            raise HTTPException(status_code=400, detail="Invalid object_key format")
        
        user_id = parts[0]
        print("user", user_id)
        
        statement = select(VideoTask).where(
            and_(
                VideoTask.created_by == user_id,
                VideoTask.video_url == s3_event.object_key,
                VideoTask.status == "created"
            )
        )
        result =  session.exec(statement)
        task = result.first()
        
        if task:
            if task.status == "created":
                task.status = "verified"
                session.commit()
                print(f"Updated task status to verified for task: {task.id}")
                process_video.delay(str(task.id), task.video_url)
                return {"message": "Task status updated successfully"}
            else:
                print(f"Task {task.id} already processed (current status: {task.status})")
                return {"message": f"Task already in {task.status} status, no update needed"}
        else:
            print(f"No matching task found for user {user_id} and URL {s3_event.object_key}")
            return {"message": "No matching task found to update"}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        print(f"Error processing S3 event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing S3 event: {str(e)}")

@app.get("/public/yt")
async def get_yt_details(url:str):
    data =  handle_request(url)
    if data:
        return data
    else:
        raise HTTPException(status_code=404, detail="Video not found")


app.include_router(user_router,  prefix="/user", tags=["user"])
app.include_router(auth_router,prefix="/auth",tags=["auth"])
app.include_router(video_router,prefix="/video",tags=["video"])
app.include_router(room_router,prefix="/room",tags=["room"])
app.include_router(public_router,prefix="/public",tags=["public"])

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: str, 
    user_id: str = Query(...),  # ... means required parameter
    name: str = Query(...)
):
    await handle_websocket(websocket, room_id, user_id, name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)