import requests
from src.services.ai_service import generate_tweet
from src.config import TWITTER_API_KEY ,TWITTER_URL
from src.schemas.schema import Tweet
from fastapi import HTTPException
from sqlmodel import select,desc

from sqlalchemy import func, or_
from math import ceil
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


def getAll(db,
           posted: bool | None = None,
           search: str | None = None,
           limit: int = 10,
           offset: int = 0):

    query = select(Tweet)
    count_query = select(func.count()).select_from(Tweet)

    if posted is not None:
        query = query.where(Tweet.posted == posted)
        count_query = count_query.where(Tweet.posted == posted)

    if search is not None:
        search_filter = or_(
            Tweet.topic.ilike(f"%{search}%"),
            Tweet.content.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_items = db.exec(count_query).first()
    total_pages = ceil(total_items / limit) if limit > 0 else 1
    current_page = (offset // limit) + 1 if limit > 0 else 1

    query = query.order_by(Tweet.id.desc()).offset(offset).limit(limit)
    tweets = db.exec(query).all()  


    return {
        "items": tweets,
        "total_items": total_items,
        "total_pages": total_pages,
        "current_page": current_page,
        "limit": limit
    }

def update_tweet(id,topic,content,db):
    tweet = db.exec(select(Tweet).where(Tweet.id == id)).first()

    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found.")
    if tweet.posted:
        raise HTTPException(status_code=400, detail="Tweet already posted and cannot be edited.")
    if topic is not None:
        tweet.topic = topic

    if content is not None:
        tweet.content = content

    db.add(tweet)
    db.commit()
    db.refresh(tweet)
    return tweet