from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from beanie import Document
from pydantic import Field, HttpUrl

class AgentRole(str, Enum):
    """Roles that agents can take in the debate."""
    ANALYST = "analyst"
    OPTIMIST = "optimist"
    PESSIMIST = "pessimist"
    REALIST = "realist"
    SPECIALIST = "specialist"

class AgentModel(Document):
    """Model for defining different agent personalities and behaviors."""
    name: str = Field(..., description="Name of the agent")
    role: AgentRole = Field(..., description="The role this agent plays in debates")
    description: str = Field(..., description="Description of the agent's personality and approach")
    system_prompt: str = Field(..., description="System prompt used to initialize the agent")
    avatar_url: Optional[HttpUrl] = Field(None, description="URL to the agent's avatar image")
    is_active: bool = Field(True, description="Whether this agent is available for new debates")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional configuration for the agent")
    
    class Settings:
        name = "agent_models"
        use_state_management = True
    
    def update_timestamp(self):
        """Update the updated_at timestamp."""
        self.updated_at = datetime.utcnow()
        return self

class AgentMessage(Document):
    """Model for storing messages exchanged during a debate session."""
    session_id: str = Field(..., description="ID of the debate session this message belongs to")
    agent_id: str = Field(..., description="ID of the agent that sent this message")
    agent_name: str = Field(..., description="Name of the agent for display purposes")
    role: AgentRole = Field(..., description="The role of the agent that sent this message")
    content: str = Field(..., description="The message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the message"
    )
    tokens_used: Optional[int] = Field(None, description="Number of tokens used to generate this message")
    is_final: bool = Field(False, description="Whether this is the final message in the debate")
    
    class Settings:
        name = "agent_messages"
        use_state_management = True
        indexes = [
            [("session_id", 1), ("timestamp", 1)],  # For fast lookups by session and time
        ]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to a dictionary for API responses."""
        return {
            "id": str(self.id),
            "session_id": self.session_id,
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "role": self.role.value,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "is_final": self.is_final,
            "metadata": self.metadata
        }
