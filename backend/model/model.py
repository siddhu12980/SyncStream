from enum import Enum
from typing import List
from uuid import uuid4
from sqlmodel import SQLModel, Field,Relationship
from datetime import datetime
from typing import Optional

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
    
class UserLogin(SQLModel):
    email: str
    password: str
    

class User(UserBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    hashed_password: str
    is_active: Optional[bool] = Field(default=True)
    video_tasks: List["VideoTask"] = Relationship(back_populates="owner")

class UserResponseModel(SQLModel):
    id: str
    username: str
    email: str
    is_active: bool

class VideoTaskBase(SQLModel):
    video_url: str
    status: ProcessingStatus = Field(default=ProcessingStatus.pending)

class VideoTask(VideoTaskBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    created_by: str = Field(foreign_key="user.id")  
    created_at: str = Field(default_factory=lambda: datetime.now())
    owner: User = Relationship(back_populates="video_tasks")  

class VideoTaskResponseModel(SQLModel):
    id: str
    video_url: str
    status: ProcessingStatus
    created_by: str
    created_at: str

class VideoTaskUpdateModel(SQLModel):
    status: ProcessingStatus

class VideoTaskCreateModel(VideoTaskBase):
    created_by: str