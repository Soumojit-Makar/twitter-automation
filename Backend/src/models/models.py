from pydantic import BaseModel,ConfigDict
from datetime import datetime
class PromptInput(BaseModel):
    topic: str

class TweetContent(BaseModel):
    content: str

class TweetUpdate(BaseModel):
    topic: str | None = None
    content: str | None = None


class TweetOut(BaseModel):
    id: int
    topic: str
    content: str
    posted: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
