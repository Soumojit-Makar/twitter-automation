import requests
from src.config import TWITTER_API_KEY ,TWITTER_URL
def post_twitter(data):
    headers = {
        "api-key": TWITTER_API_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "username": "soumojit",
        "text": data.content
        }
    
    return requests.post(TWITTER_URL, headers=headers, json=body)
