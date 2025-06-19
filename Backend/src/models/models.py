from pydantic import BaseModel
class PromptInput(BaseModel):
    topic: str

class TweetContent(BaseModel):
    content: str