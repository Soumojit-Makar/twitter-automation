from src.services.twitter_service import TweetService
from src.routes.twitter_routes import TweetRouter

tweet_service = TweetService()
tweet_router = TweetRouter(tweet_service)
