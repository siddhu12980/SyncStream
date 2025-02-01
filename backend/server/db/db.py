from sqlmodel import Session, SQLModel, create_engine


urls = "postgresql://myuser:mypassword@localhost:5432/mydb"
engine = create_engine(urls, echo=True)


def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session