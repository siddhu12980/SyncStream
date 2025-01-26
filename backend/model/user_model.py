from pydantic import BaseModel
import datetime


class User(BaseModel):
    username: str
    full_name: str = None
    password: str
    created_at: str = datetime.datetime.now()
    updated_at: str = datetime.datetime.now()
    
    
class CreateUserModel(BaseModel):
    username: str
    full_name: str = None
    password: str
    
class UpdateUserModel(BaseModel):
    username: str
    full_name: str = None
    password: str
    


