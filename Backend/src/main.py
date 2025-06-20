from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.twitter_routes import router as TwitterRoutes
from contextlib import asynccontextmanager
from src.db import create_table
from src.config import FRONTEND_URL
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_table()
    yield
app = FastAPI(
    title=" Twitter Automation API",
    version="1.0.0",
    description="An API that generates, stores, and posts AI-powered tweets.",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(TwitterRoutes)
