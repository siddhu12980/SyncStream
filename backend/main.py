from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Annotated
from sqlmodel import Session
from db import db
from fastapi import Request
from fastapi.responses import JSONResponse
from auth.util import decode_token
from model.model import User

from user.routes import user_router
from auth.router import auth_router
from videotask.routes import video_router

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

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    
    if request.url.path in ["/auth/login", "/docs", "/redoc", "/auth/signup","/openapi.json"]:
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
                
            user_id = token_data.get("user")
            if not user_id:
                raise HTTPException(status_code=401, detail="User ID missing from token")
                
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            raise HTTPException(status_code=401, detail="Token validation failed")
            
        try:
            async with db.get_session() as session:
                user = await session.get(User, user_id)
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")
                    
                request.state.user = user
                
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


app.include_router(user_router,  prefix="/user", tags=["user"])
app.include_router(auth_router,prefix="/auth",tags=["auth"])
app.include_router(video_router,prefix="/video",tags=["video"])