from fastapi import APIRouter, HTTPException
from src.models.models import PromptInput ,TweetContent
from src.services.ai_service import generate_tweet
from src.services.twitter_service import post_twitter
router = APIRouter(prefix="/tweet", tags=["tweets"])

@router.post("/generate-tweet")
def api_generate_tweet(data: PromptInput):
    tweet = generate_tweet(data.topic)
    return {"tweet": tweet}
@router.post("/post-tweet")
def api_post_tweet(data: TweetContent):
    
    response = post_twitter(data)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    
    return {"status": "posted to Twitter Clone", "tweet": data.content}