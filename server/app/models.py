from beanie import Document
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ---------- File Document ----------
class DocumentModel(Document):
    user_id: Optional[str] = None
    filename: str
    file_type: str
    upload_time: datetime = Field(default_factory=datetime.utcnow)
    status: str = "uploaded"
    storage_path: str
    extracted_text: Optional[str] = None
    metadata: dict = {}

    class Settings:
        name = "documents"


# ---------- Debate Session ----------
class AgentMessage(BaseModel):
    agent_name: str
    role: str
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AgentModel(BaseModel):
    name: str
    role: str
    messages: List[AgentMessage] = []

class DebateSession(Document):
    topic: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    agents: List[AgentModel] = []
    rounds: int = 0
    final_summary: Optional[str] = None

    class Settings:
        name = "debate_sessions"
