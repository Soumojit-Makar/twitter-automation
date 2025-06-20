from fastapi import APIRouter, HTTPException,Depends
from src.models.models import PromptInput ,TweetUpdate

from src.services.twitter_service import post_twitter,generate_tweet_service,getAll,update_tweet
from src.db import get_db
from sqlmodel import Session
router = APIRouter(prefix="/tweet", tags=["tweets"])

@router.post("/generate-tweet")
def api_generate_tweet(data: PromptInput ,session: Session = Depends(get_db) ):
    return generate_tweet_service(data.topic,session)
@router.post("/post-tweet/{tweet_id}")
def api_post_tweet(tweet_id: int,session: Session = Depends(get_db)):
    return post_twitter(id=tweet_id,db=session)
@router.put("/edit/{tweet_id}")
async def edit_tweet(tweet_id: int, tweet: TweetUpdate,session:Session=Depends(get_db)):
    result = update_tweet(tweet_id, tweet.topic, tweet.content,session)
    return {
        "message": "Tweet updated successfully!",
        "tweet": result
    }
@router.get("/tweets")
def get_all_tweets(session: Session = Depends(get_db)):
    return getAll(session)