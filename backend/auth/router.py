from fastapi import HTTPException,APIRouter,status
from fastapi.responses import JSONResponse
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from auth.util import verify_hash, generate_token
from model.model import UserCreate, UserLogin
from db.db import get_session

from user.service import UserService

auth_router = APIRouter()

user_service = UserService()

REFRESH_TOKEN_EXP = 1

@auth_router.post('/signup', status_code=status.HTTP_201_CREATED)

async def user_signup( user_data: UserCreate, session : AsyncSession = Depends(get_session)):
    
    user_email = user_data.email

    is_user = await user_service.user_exists(user_email, session)
    
    if is_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='User with email already exists')
    
    else:
        new_user = await user_service.create_user(user_data, session)


    return new_user

@auth_router.post('/login', status_code=status.HTTP_200_OK)
async def user_signin(user_data: UserLogin, session : AsyncSession = Depends(get_session)):
    user_email = user_data.email

    is_User = await user_service.user_exists(user_email, session)
    if is_User is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User doesnt exists, try signup')
    
    
    if verify_hash(user_data.password, is_User.hashed_password):
        
        access_token = generate_token(
            user_data = {
                'email': is_User.email,
                'user_id': str(is_User.id)
            }
        )

        refresh_token = generate_token(
            user_data={
                'email': is_User.email,
                'user_id': str(is_User.id)
            },
            refresh=True,
            expiry=timedelta(days=REFRESH_TOKEN_EXP)

        )

        return JSONResponse(
            content={
                'message': 'Login successfull',
                'access-token': access_token,
                'refresh-token': refresh_token,
                'user': {
                    'email': is_User.email,
                    'id': str(is_User.id)
                }
            }
        )
    raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail='Details are wrong')