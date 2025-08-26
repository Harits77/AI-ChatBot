from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    session_id: Optional[str] = None   # optional now
    messages: List[Message]

class ChatResponse(BaseModel):
    session_id: str
    reply: str
