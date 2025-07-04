from dotenv import load_dotenv
import os
load_dotenv()
GIMINI_API_KEY=os.getenv("GIMINI_API_KEY")
TWITTER_URL=os.getenv("TWITTER_CLONE_URL")
TWITTER_API_KEY=os.getenv("TWITTER_CLONE_API_KEY")
DB_URL=os.getenv("DB_URL")
# DB_URL="fshfbshfbshfbs"
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
HUGGINGFACE_TOKEN=os.getenv("HUGGINGFACE_TOKEN")