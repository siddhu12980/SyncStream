from sqlmodel import Field,  SQLModel, create_engine, select
from typing import Optional
from uuid import uuid4
from enum import Enum

class ProcessingStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"



class UserBase(SQLModel):
    username: str = Field(index=True, unique=True)
    email: str = Field(unique=True)
    
class UserCreate(UserBase):
    password: str

class User(UserBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    hashed_password: str
    is_active: bool = True
    
class UserResposneModel(SQLModel):
    id: str
    username: str
    email: str
    is_active: bool
    