from sqlmodel import create_engine,Session,SQLModel
from typing import Annotated
from fastapi import Depends
from src.config import  DB_URL


engine = create_engine(DB_URL)
def create_table():
    SQLModel.metadata.create_all(bind=engine)
def get_db():
    with Session(engine) as session:
        yield session

SessionDep=Annotated[Session,Depends(get_db)]