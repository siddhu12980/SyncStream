from fastapi import HTTPException
from sqlmodel import select
from .model import  UserCreate
from sqlmodel.ext.asyncio.session import AsyncSession
from passlib.hash import bcrypt
from model.model import User


class UserService:
    
    async def create_user(
        self, 
        user: UserCreate, 
        session: AsyncSession
    ):
        print("Creating user...", user)
        
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
            hashed_password=hashed_password,
            video_tasks=[],
            is_active=True
        )
        
        try:
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            
            return {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "is_active": new_user.is_active
            }
            
        except Exception as e:
            session.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Error creating user: {str(e)}"
            )    
            
            
    async def read_user(self,user_id: str, session: AsyncSession):
        print("Reading user...", user_id)
    
        user = session.get(User, user_id)
    
        if not user:
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )
    
        return user

    async def read_users(self,session: AsyncSession):
        print("Reading users...")
    
        users = session.exec(select(User)).all()
    
        return users


    async def delete_user(self, user_id: str, session: AsyncSession):
        print("Deleting user...", user_id)
        
        user = session.get(User, user_id)
        
        if not user:
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )
        
        session.delete(user)
        await session.commit()
        
        return {"message": "User deleted successfully"}
    
    
    

    async def update_user(
        self,
        user_id: str, 
        user: UserCreate, 
        session: AsyncSession
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
            "email": existing_user.email,
            "is_active":existing_user.is_active
        }
        
    async def user_exists(self, email: str, session: AsyncSession):
            print("Checking if user exists...", email)
            
            user = session.exec(
                select(User).where(User.email == email)
            ).first()
            
            #if user exists return user else return None
            
            user = user if user else None
            
            return user
        
        
