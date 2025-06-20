from pydantic import BaseModel
class PromptInput(BaseModel):
    topic: str

class TweetContent(BaseModel):
    content: str

class TweetUpdate(BaseModel):
    topic: str | None = None
    content: str | None = None
