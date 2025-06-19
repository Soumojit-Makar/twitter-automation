
from fastapi import APIRouter, HTTPException
from src.models.models import PromptInput ,TweetContent
from src.services.ai_service import generate_tweet
router = APIRouter(prefix="/tweet", tags=["Expenses"])

@router.post("/generate-tweet")
def api_generate_tweet(data: PromptInput):
    tweet = generate_tweet(data.topic)
    return {"tweet": tweet}

@router.post("/post-tweet")
def api_post_tweet(data: TweetContent):
    # TODO: Replace this with actual Twitter clone post
    print(f"Tweet posted: {data.content}")
    return {"status": "posted", "tweet": data.content}