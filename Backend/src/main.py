from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.twitter_routes import router as TwitterRoutes
app = FastAPI(
    title=" My App",
    version="1.0.0",
    description="",
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
