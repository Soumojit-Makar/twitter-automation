from fastapi import APIRouter, HTTPException,Depends
from src.models.models import PromptInput ,TweetContent

from src.services.twitter_service import post_twitter,generate_tweet_service,getAll
from src.db import get_db
from sqlmodel import Session
router = APIRouter(prefix="/tweet", tags=["tweets"])

@router.post("/generate-tweet")
def api_generate_tweet(data: PromptInput ,session: Session = Depends(get_db) ):
    return generate_tweet_service(data.topic,session)
@router.post("/post-tweet/{tweet_id}")
def api_post_tweet(tweet_id: int,session: Session = Depends(get_db)):
    return post_twitter(id=tweet_id,db=session)
    
@router.get("/tweets")
def get_all_tweets(session: Session = Depends(get_db)):
    return getAll(session)