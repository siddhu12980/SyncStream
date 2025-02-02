from fastapi import APIRouter, Depends
from .model import UserResponseModel, UserCreate
from .service import UserService
from backend.server.db.db import get_session
from sqlalchemy.ext.asyncio import AsyncSession


user_router = APIRouter()
user_service = UserService()



@user_router.post("/", response_model=UserResponseModel)
async def create_user(user:UserCreate,session:AsyncSession = Depends(get_session)):
    return await user_service.create_user(user,session )


@user_router.get("/", response_model=list[UserResponseModel])
async def read_users(session:  AsyncSession = Depends(get_session)):
    return await user_service.read_users(session)

@user_router.get("/{user_id}", response_model=UserResponseModel)
async def read_user(user_id: str, session: AsyncSession = Depends(get_session)):
    return await user_service.read_user(user_id, session)


@user_router.delete("/{user_id}")
async def delete_user(user_id: str, session: AsyncSession = Depends(get_session)):
    return await user_service.delete_user(user_id, session)

@user_router.put("/{user_id}", response_model=UserResponseModel)
async def update_user(user_id: str, user: UserCreate, session: AsyncSession = Depends(get_session)):
    return await user_service.update_user(user_id, user, session)
