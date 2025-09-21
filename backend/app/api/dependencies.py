from fastapi import Depends, HTTPException, status
from typing import Optional
from ..services.analysis_service import AnalysisService
from ..services.vector_store import VectorStore
from ..services.web_scraper import WebScraper
from ..services.agent_context_service import AgentContextService

# Service Dependencies
def get_analysis_service() -> AnalysisService:
    """Dependency for AnalysisService."""
    return AnalysisService()

def get_vector_store() -> VectorStore:
    """Dependency for VectorStore."""
    return VectorStore()

def get_web_scraper() -> WebScraper:
    """Dependency for WebScraper."""
    return WebScraper()

def get_agent_context_service(
    vector_store: VectorStore = Depends(get_vector_store)
) -> AgentContextService:
    """
    Dependency for AgentContextService.
    
    Args:
        vector_store: Injected VectorStore dependency
        
    Returns:
        AgentContextService instance
    """
    return AgentContextService(vector_store=vector_store)
