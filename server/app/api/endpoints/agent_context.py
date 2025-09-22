from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from pydantic import BaseModel

from ...services.agent_context_service import AgentContextService
from ...models.startup import AgentContext
from ..dependencies import get_agent_context_service

router = APIRouter()

class AgentContextRequest(BaseModel):
    """Request model for getting agent context."""
    startup_id: str
    agent_role: str
    query: str
    top_k: Optional[int] = 5
    threshold: Optional[float] = 0.7

@router.post("/context", response_model=AgentContext, response_model_exclude_none=True)
async def get_agent_context(
    request: AgentContextRequest,
    agent_context_service: AgentContextService = Depends(get_agent_context_service)
) -> Dict[str, Any]:
    """
    Get relevant context for an agent based on their role and query.
    
    This endpoint retrieves the most relevant information from the vector store
    to assist an investment committee agent in their analysis.
    
    Args:
        request: The agent context request containing:
            - startup_id: ID of the startup being analyzed
            - agent_role: Role of the agent (e.g., 'market_analyst', 'financial_analyst')
            - query: The current query or context from the agent
            - top_k: Number of relevant chunks to retrieve (default: 5)
            - threshold: Minimum similarity score for including results (default: 0.7)
            
    Returns:
        AgentContext containing relevant information for the agent
    """
    try:
        context = await agent_context_service.get_agent_context(
            startup_id=request.startup_id,
            agent_role=request.agent_role,
            query=request.query,
            top_k=request.top_k,
            threshold=request.threshold
        )
        
        # Convert to Pydantic model for validation
        return AgentContext(**context)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent context: {str(e)}"
        )

@router.get("/roles", response_model=Dict[str, Any])
async def get_available_roles() -> Dict[str, Any]:
    """
    Get the list of available agent roles and their descriptions.
    
    Returns:
        Dictionary mapping role names to their descriptions
    """
    return {
        "market_analyst": "Analyzes market size, competition, and growth potential",
        "financial_analyst": "Analyzes financial health, metrics, and projections",
        "product_analyst": "Evaluates product features and technical aspects",
        "team_analyst": "Assesses the founding team and company culture",
        "risk_analyst": "Identifies potential risks and challenges"
    }
