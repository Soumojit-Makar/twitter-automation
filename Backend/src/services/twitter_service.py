import requests
from src.services.ai_service import generate_tweet
from src.config import TWITTER_API_KEY ,TWITTER_URL
from src.schemas.schema import Tweet
from fastapi import HTTPException
from sqlmodel import select
def generate_tweet_service(topic,db):
    tweet =  generate_tweet(topic)
    tweet_entry= Tweet(content=tweet,topic=topic)
    db.add(tweet_entry)
    db.commit()
    db.refresh(tweet_entry)
    return {"tweet": tweet, "id": tweet_entry.id}
def post_twitter(id,db):
    tweet = db.get(Tweet, id)
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")

    if tweet.posted:
        return {"status": "already posted", "tweet": tweet.content}
    headers = {
        "api-key": TWITTER_API_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "username": "soumojit",
        "text": tweet.content
        }
    
    response= requests.post(TWITTER_URL, headers=headers, json=body)
    if response.status_code == 200:
        tweet.posted = True
        db.commit()
        return {"status": "posted", "tweet": tweet.content}
    else:
        raise HTTPException(status_code=response.status_code, detail=response.text)
def getAll(db):
    return db.exec(select(Tweet)).all()