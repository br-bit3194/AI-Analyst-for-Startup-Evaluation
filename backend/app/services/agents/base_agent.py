from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel

class AgentResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    error: Optional[str] = None
    confidence: float = 0.0

class BaseAgent(ABC):
    """Base class for all agents in the system."""
    
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        self.context = {}
    
    async def set_context(self, context: Dict[str, Any]):
        """Set the context for this agent's analysis."""
        self.context = context
    
    @abstractmethod
    async def analyze(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Main analysis method to be implemented by each agent."""
        pass
    
    def _format_response(self, data: Dict[str, Any], success: bool = True, 
                        error: Optional[str] = None, confidence: float = 1.0) -> AgentResponse:
        """Helper method to format consistent responses."""
        return AgentResponse(
            success=success,
            data=data,
            error=error,
            confidence=confidence
        )
