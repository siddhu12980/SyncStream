from fastapi import FastAPI,HTTPException

from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session,select

from db import db
from fastapi import Request
from fastapi.responses import JSONResponse
from auth.util import decode_token
from model.model import User
from pydantic import BaseModel
from user.routes import user_router
from auth.router import auth_router
from videotask.routes import video_router
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from db.db import get_session
from typing import Callable,Annotated
import json

import logging


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



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



logger = logging.getLogger(__name__)


logger = logging.getLogger(__name__)

@app.middleware("http")
async def auth_middleware(request: Request, call_next: Callable):
    if request.url.path in ["/auth/login","/s3" ,"/docs", "/redoc", "/auth/signup", "/openapi.json"]:
        return await call_next(request)
        
    try:
        auth_header = request.headers.get("Authorization")
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

@app.post("/s3",status_code=200)
async def read_s3(request: Request,session : AsyncSession = Depends(get_session)):
    
    auth_header = request.headers.get("Authorization")
    
    if auth_header != SECRET_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid Authorization header")

    print("Auth passed")
    
    body = await request.body()
    try:
        data = json.loads(body)
        
        s3_event = S3Event(**data)
        
        print(f"\n Received S3 Event: {s3_event} \n")
        
        print("Saving to database...")
        
        parts = s3_event.object_key.split("/")
        
        if len(parts) < 2:
            raise HTTPException(status_code=400, detail="Invalid object_key format")
        
        user_id = parts[0]
        
        print("user",user_id)
        
        
        return {"message": "Webhook received successfully"}
    
    
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")


app.include_router(user_router,  prefix="/user", tags=["user"])
app.include_router(auth_router,prefix="/auth",tags=["auth"])
app.include_router(video_router,prefix="/video",tags=["video"])