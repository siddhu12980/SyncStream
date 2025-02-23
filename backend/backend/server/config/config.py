from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
import os

class Settings(BaseSettings):
    print("Current Working Directory:", os.getcwd())
    
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str
    CELERY_BROKER_URL : str
    CELERY_RESULT_BACKEND: str 
    
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')



Config = Settings()