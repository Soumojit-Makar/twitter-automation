import traceback
from sqlmodel import create_engine,Session,SQLModel

from src.config import  DB_URL

engine= create_engine(DB_URL)
def create_table():
        SQLModel.metadata.create_all(bind=engine)
        print("Create Tables")

def get_db():
        try:
            with Session(engine) as session:
                yield session
        except:
            traceback.print_exc()
        return None

# SessionDep=Annotated[Session,Depends(get_db)]