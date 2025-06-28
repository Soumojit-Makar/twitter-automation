from fastapi import APIRouter, HTTPException,Depends,Query
from src.models.models import PromptInput ,TweetUpdate,TweetOut

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
def get_all_tweets(
    posted: bool | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_db)):
    result = getAll(session, posted, search, limit, offset)
    tweets_out = [
    TweetOut.from_orm(tweet[0]) if isinstance(tweet, (tuple, list)) else TweetOut.from_orm(tweet)
    for tweet in result["items"]
    ]
    result["items"] = tweets_out
    return result