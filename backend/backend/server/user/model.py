from uuid import uuid4
from typing import List
from sqlmodel import SQLModel


class UserBase(SQLModel):
    username: str 
    email: str 

class UserCreate(UserBase):
    password: str

class UserResponseModel(SQLModel):  
    id: str
    username: str
    email: str
    is_active: bool

