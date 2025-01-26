from fastapi import FastAPI,Depends,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Annotated
from sqlmodel import Session,select
from db import db
from passlib.hash import bcrypt
from model.model import UserBase, UserCreate, User,UserResposneModel



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
    
@app.post("/users/", response_model=UserResposneModel)
async def create_user(
    user: UserCreate, 
    session: SessionDep
):
    print("Creating user...", user)
    
    # Check for existing user
    existing_user = session.exec(
        select(User).where(
            (User.username == user.username) | (User.email == user.email)
        )
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Username or email already exists"
        )
    
    hashed_password = bcrypt.hash(user.password)
    
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    
    try:
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        
        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating user: {str(e)}"
        )
        
@app.get("/users/{user_id}", response_model=UserResposneModel)
async def read_user(user_id: str, session: SessionDep):
    print("Reading user...", user_id)
    
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="User not found"
        )
    
    return user

@app.get("/users/", response_model=list[UserResposneModel])
async def read_users(session: SessionDep):
    print("Reading users...")
    
    users = session.exec(select(User)).all()
    
    return users

@app.delete("/users/{user_id}")
async def delete_user(user_id: str, session: SessionDep):
    print("Deleting user...", user_id)
    
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="User not found"
        )
    
    session.delete(user)
    session.commit()
    
    return {"message": "User deleted successfully"}

@app.put("/users/{user_id}", response_model=UserResposneModel)
async def update_user(
    user_id: str, 
    user: UserCreate, 
    session: SessionDep
):
    print("Updating user...", user_id)
    
    existing_user = session.get(User, user_id)
    
    if not existing_user:
        raise HTTPException(
            status_code=404, 
            detail="User not found"
        )
    
    existing_user.username = user.username
    existing_user.email = user.email
    existing_user.hashed_password = bcrypt.hash(user.password)
    
    session.add(existing_user)
    session.commit()
    session.refresh(existing_user)
    
    return {
        "id": existing_user.id,
        "username": existing_user.username,
        "email": existing_user.email
    }