from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.twitter_routes import router as TwitterRoutes
from contextlib import asynccontextmanager
from src.db import create_table
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_table()
    yield
app = FastAPI(
    title=" My App",
    version="1.0.0",
    description="",
    lifespan=lifespan
)

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(TwitterRoutes)
