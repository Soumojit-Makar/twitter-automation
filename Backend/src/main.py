from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from contextlib import asynccontextmanager
from src.beans import   tweet_router
from src.db import get_db,create_table
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        db = get_db()
        if db:

            create_table()

            yield
        else:
            print("Database not found")
    except Exception as e:
        print(f"Error during lifespan: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
app = FastAPI(
    title=" Twitter Automation API",
    version="1.0.0",
    description="An API that generates, stores, and posts AI-powered tweets.",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://twitter-automation-beta.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")
app.include_router(tweet_router.router)
