import os
import traceback
import requests
from src.services.ai_service import agentic_tweet_workflow,generate_image
from src.config import TWITTER_API_KEY, TWITTER_URL
from src.schemas.schema import Tweet
from fastapi import HTTPException
from sqlmodel import select, Session
from sqlalchemy import func, or_
from math import ceil
from pathlib import Path


class TweetService:

    def generate_tweet_service(self, topic: str, db: Session):
        if not topic:
            raise HTTPException(status_code=400, detail="Topic cannot be empty")
        if len(topic) > 100:
            raise HTTPException(status_code=400, detail="Topic is too long, must be under 100 characters")
        try:

            tweet = agentic_tweet_workflow(topic)
            tweet_entry = Tweet(content=tweet['tweet'], topic=topic, image_path=tweet['image'] if 'image' in tweet else None)
            db.add(tweet_entry)
            db.commit()
            db.refresh(tweet_entry)
            return {"tweet": tweet, "id": tweet_entry.id}
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"An error occurred while generating the tweet: {str(e)}")

    def post_twitter(self, id: int, db: Session):
        if not TWITTER_API_KEY or not TWITTER_URL:
            raise HTTPException(status_code=500, detail="Twitter API credentials are not configured")
        if not id:
            raise HTTPException(status_code=400, detail="Tweet ID is required")
        if not isinstance(id, int):
            raise HTTPException(status_code=400, detail="Tweet ID must be an integer")
        if id <= 0:
            raise HTTPException(status_code=400, detail="Tweet ID must be a positive integer")
        if not db:
            raise HTTPException(status_code=400, detail="Database session is required")
        if not db.is_active:
            raise HTTPException(status_code=500, detail="Database session is not active")
        try:
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

            response = requests.post(TWITTER_URL, headers=headers, json=body)
            if response.status_code == 200:
                tweet.posted = True
                db.commit()
                return {"status": "posted", "tweet": tweet.content}
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
        except requests.RequestException as e:
            raise HTTPException(status_code=500, detail=f"An error occurred while posting the tweet: {str(e)}")

    def getAll(self, db: Session, posted: bool | None = None, search: str | None = None,
               limit: int = 10, offset: int = 0):
        if not db:
            raise HTTPException(status_code=400, detail="Database session is required")
        if not db.is_active:
            raise HTTPException(status_code=500, detail="Database session is not active")
        if limit < 0:
            raise HTTPException(status_code=400, detail="Limit must be a non-negative integer")
        if offset < 0:
            raise HTTPException(status_code=400, detail="Offset must be a non-negative integer")
        if limit == 0:
            limit = 10
        if offset < 0:
            offset = 0
        if search is not None and len(search) > 100:
            raise HTTPException(status_code=400, detail="Search query is too long, must be under 100 characters")
        if posted is not None and not isinstance(posted, bool):
            raise HTTPException(status_code=400, detail="Posted filter must be a boolean value")
        if not isinstance(limit, int) or not isinstance(offset, int):
            raise HTTPException(status_code=400, detail="Limit and offset must be integers")
        try:
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

            tweets = db.exec(query.order_by(Tweet.id.desc()).offset(offset).limit(limit)).all()

            return {
                "items": tweets,
                "total_items": total_items,
                "total_pages": total_pages,
                "current_page": current_page,
                "limit": limit
            }
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"An error occurred while fetching tweets: {str(e)}")
        

    def update_tweet(self, id: int, topic: str, content: str, db: Session):
        if not db:
            raise HTTPException(status_code=400, detail="Database session is required")
        if not db.is_active:
            raise HTTPException(status_code=500, detail="Database session is not active")
        if not id:
            raise HTTPException(status_code=400, detail="Tweet ID is required")
        if not isinstance(id, int):
            raise HTTPException(status_code=400, detail="Tweet ID must be an integer")
        if id <= 0:
            raise HTTPException(status_code=400, detail="Tweet ID must be a positive integer")
        if not topic and not content:
            raise HTTPException(status_code=400, detail="At least one of topic or content must be provided")
        
        try:
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
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"An error occurred while updating the tweet: {str(e)}")
    def get_generated_image(self, tweet_id: int, db: Session):
        if not db:
            raise HTTPException(status_code=400, detail="Database session is required")
        if not db.is_active:
            raise HTTPException(status_code=500, detail="Database session is not active")
        if not tweet_id:
            raise HTTPException(status_code=400, detail="Tweet ID is required")
        if not isinstance(tweet_id, int):
            raise HTTPException(status_code=400, detail="Tweet ID must be an integer")
        if tweet_id <= 0:
            raise HTTPException(status_code=400, detail="Tweet ID must be a positive integer")

        try:
            tweet = db.exec(select(Tweet).where(Tweet.id == tweet_id)).first()
            if not tweet:
                raise HTTPException(status_code=404, detail="Tweet not found")
            if not tweet.image_path:
                raise HTTPException(status_code=404, detail="No image generated for this tweet")

            image_path = tweet.image_path
            if not image_path:
                image_path = generate_image(tweet.topic)
            else:
                if not Path(image_path).exists():
                    image_path = generate_image(tweet.topic)
                else:
                    os.remove(image_path)  # Remove old image if it exists
                    image_path = generate_image(tweet.topic)
            if not image_path:
                raise HTTPException(status_code=500, detail="Failed to generate image")
                    
            tweet.image_path = image_path
            db.add(tweet)
            db.commit()
            db.refresh(tweet)
            image_path = tweet.image_path
            return {
                "image_path": image_path,
                "tweet_id": tweet_id
            }
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"An error occurred while fetching the image: {str(e)}")
    def get_single_tweet(self, tweet_id: int, db: Session):
        if not db:
            raise HTTPException(status_code=400, detail="Database session is required")
        if not db.is_active:
            raise HTTPException(status_code=500, detail="Database session is not active")
        if not tweet_id:
            raise HTTPException(status_code=400, detail="Tweet ID is required")
        if not isinstance(tweet_id, int):
            raise HTTPException(status_code=400, detail="Tweet ID must be an integer")
        if tweet_id <= 0:
            raise HTTPException(status_code=400, detail="Tweet ID must be a positive integer")

        try:
            tweet = db.exec(select(Tweet).where(Tweet.id == tweet_id)).first()
            if not tweet:
                raise HTTPException(status_code=404, detail="Tweet not found")
            return tweet
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"An error occurred while fetching the tweet: {str(e)}")