from fastapi import FastAPI,Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Annotated
from sqlmodel import Session
from db import db

from user.routes import user_router
from auth.router import auth_router


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


SessionDep = Annotated[Session, Depends(db.get_session)]


@app.get("/")
def read_root():
    return {"Hello": "World"}


app.include_router(user_router, prefix="/user", tags=["user"])
app.include_router(auth_router,prefix="/auth",tags=["auth"])