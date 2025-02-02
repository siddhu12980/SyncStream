from sqlmodel import Session, SQLModel, create_engine
from backend.server.config.config import Config as settings

if settings.DATABASE_URL is None:
    raise ValueError("DATABASE_URL is not set")

engine = create_engine(settings.DATABASE_URL, echo=True)

class Database:
    def __init__(self):
        self.engine = engine
    
    def init_db(self):
        SQLModel.metadata.create_all(self.engine)

# Create a singleton instance
db = Database()

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session