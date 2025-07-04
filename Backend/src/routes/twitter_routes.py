from fastapi import APIRouter, Depends, Query,HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from src.models.models import PromptInput, TweetUpdate, TweetOut
from src.db import get_db  
from src.schemas.schema import Tweet
import os
from pathlib import Path
from fastapi.responses import FileResponse
class TweetRouter:
    def __init__(self, tweet_service):
        self.tweet_service = tweet_service
        self.router = APIRouter(prefix="/tweet", tags=["Tweets"])

        self.router.post("/generate-tweet")(self.api_generate_tweet)
        self.router.post("/post-tweet/{tweet_id}")(self.api_post_tweet)
        self.router.put("/edit/{tweet_id}")(self.edit_tweet)
        self.router.get("/tweets")(self.get_all_tweets)
        self.router.get("/image-generate/{tweet_id}")(self.get_generated_image)
        self.router.get("/image/{tweet_id}")(self.get_image)
        self.router.delete("/image/{tweet_id}")(self.delete_image)
    

    def api_generate_tweet(self, data: PromptInput, db: Session = Depends(get_db)):
        return self.tweet_service.generate_tweet_service(data.topic, db)

    def api_post_tweet(self, tweet_id: int, db: Session = Depends(get_db)):
        return self.tweet_service.post_twitter(id=tweet_id, db=db)

    def edit_tweet(self, tweet_id: int, tweet: TweetUpdate, db: Session = Depends(get_db)):
        result = self.tweet_service.update_tweet(tweet_id, tweet.topic, tweet.content, db=db)
        return {
            "message": "Tweet updated successfully!",
            "tweet": result
        }

    def get_all_tweets(
        self,
        posted: bool | None = Query(None),
        search: str | None = Query(None),
        limit: int = Query(10, ge=1),
        offset: int = Query(0, ge=0),
        db: Session = Depends(get_db)
    ):
        result = self.tweet_service.getAll(db=db, posted=posted, search=search, limit=limit, offset=offset)
        result["items"] = [TweetOut.from_orm(tweet) for tweet in result["items"]]
        return result

    def get_generated_image(self, tweet_id: int, db: Session = Depends(get_db)):
        return self.tweet_service.get_generated_image(tweet_id, db)
    def get_image(self, tweet_id: int, db: Session = Depends(get_db)):
        try:
            tweet: Tweet = self.tweet_service.get_single_tweet(tweet_id, db)
            if not tweet or not tweet.image_path:
                raise HTTPException(status_code=404, detail="Image path not found in tweet")
            
            image_path = Path(tweet.image_path)
            if not image_path.exists():
                raise HTTPException(status_code=404, detail="Image file not found on disk")

            return FileResponse(image_path, media_type="image/png", filename=image_path.name)
        
        except HTTPException as http_exc:
            raise http_exc 
        except Exception as e:
            print(f"Unexpected error in get_image: {e}")
            raise HTTPException(status_code=500, detail="Unexpected server error while fetching image")

    def delete_image(self, tweet_id: int, db: Session = Depends(get_db)) -> dict:
        tweet = self.get_single_tweet(tweet_id, db)
        if not tweet or not tweet.image_path:
            raise HTTPException(status_code=404, detail="Tweet or image not found")

        try:
            if os.path.exists(tweet.image_path):
                os.remove(tweet.image_path)
                tweet.image_path = None
                db.add(tweet)
                db.commit()
                return {"message": "Image deleted successfully."}
            else:
                raise HTTPException(status_code=404, detail="Image file not found on disk")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

            