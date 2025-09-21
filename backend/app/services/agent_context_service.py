from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from ..models.startup import StartupAnalysis
from .vector_store import VectorStore

logger = logging.getLogger(__name__)

class AgentContextService:
    """
    Service for retrieving and managing context for investment committee agents.
    Provides relevant information from the vector store to assist in decision making.
    """
    
    def __init__(self, vector_store: Optional[VectorStore] = None):
        self.vector_store = vector_store or VectorStore()
    
    async def get_agent_context(
        self,
        startup_id: str,
        agent_role: str,
        query: str,
        top_k: int = 5,
        threshold: float = 0.7
    ) -> Dict[str, Any]:
        """
        Get relevant context for an agent based on their role and the current query.
        
        Args:
            startup_id: ID of the startup being analyzed
            agent_role: Role of the agent (e.g., 'market_analyst', 'financial_analyst')
            query: The current query or context from the agent
            top_k: Number of relevant chunks to retrieve
            threshold: Minimum similarity score for including results
            
        Returns:
            Dictionary containing relevant context and metadata
        """
        logger.info(f"Getting context for {agent_role} agent for startup {startup_id}")
        
        # Get the vector store for this startup
        if not self.vector_store.store_exists(startup_id):
            logger.warning(f"No vector store found for startup {startup_id}")
            return {
                "startup_id": startup_id,
                "agent_role": agent_role,
                "relevant_chunks": [],
                "timestamp": datetime.utcnow().isoformat(),
                "error": "No data available for this startup"
            }
        
        try:
            # Role-specific query enhancement
            enhanced_query = self._enhance_query_for_role(query, agent_role)
            
            # Search the vector store
            results = self.vector_store.search_similar(
                startup_id,
                enhanced_query,
                k=top_k
            )
            
            # Filter results by threshold
            relevant_chunks = [
                {
                    "text": r["text"],
                    "score": float(r["score"]),
                    "metadata": r.get("metadata", {})
                }
                for r in results
                if r["score"] >= threshold
            ]
            
            # Add role-specific analysis
            analysis = self._analyze_for_role(relevant_chunks, agent_role)
            
            return {
                "startup_id": startup_id,
                "agent_role": agent_role,
                "query": query,
                "enhanced_query": enhanced_query,
                "relevant_chunks": relevant_chunks,
                "analysis": analysis,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting agent context: {str(e)}", exc_info=True)
            return {
                "startup_id": startup_id,
                "agent_role": agent_role,
                "query": query,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _enhance_query_for_role(self, query: str, role: str) -> str:
        """Enhance the query based on the agent's role."""
        role_contexts = {
            "market_analyst": (
                "market size, competition, growth potential, industry trends, "
                "target audience, market share, competitive landscape"
            ),
            "financial_analyst": (
                "revenue, expenses, profit margins, cash flow, financial projections, "
                "unit economics, burn rate, runway, valuation, funding history"
            ),
            "product_analyst": (
                "product features, technology stack, unique selling proposition, "
                "product roadmap, technical challenges, scalability"
            ),
            "team_analyst": (
                "founder background, team experience, key hires, advisory board, "
                "hiring strategy, company culture"
            ),
            "risk_analyst": (
                "risks, challenges, threats, weaknesses, legal issues, "
                "regulatory compliance, market risks, operational risks"
            )
        }
        
        role_context = role_contexts.get(role.lower(), "")
        if role_context:
            return f"{query} {role_context}"
        return query
    
    def _analyze_for_role(self, chunks: List[Dict], role: str) -> Dict[str, Any]:
        """Perform role-specific analysis on the retrieved chunks."""
        if not chunks:
            return {"summary": "No relevant information found", "key_points": []}
        
        # Extract text from chunks for analysis
        texts = [chunk["text"] for chunk in chunks]
        
        # Basic analysis that applies to all roles
        analysis = {
            "total_chunks": len(chunks),
            "average_confidence": sum(chunk["score"] for chunk in chunks) / len(chunks),
            "key_points": self._extract_key_points(texts, role),
            "potential_concerns": self._identify_concerns(texts, role)
        }
        
        # Add role-specific analysis
        if role.lower() == "financial_analyst":
            analysis["financial_metrics"] = self._extract_financial_metrics(texts)
        elif role.lower() == "market_analyst":
            analysis["market_metrics"] = self._extract_market_metrics(texts)
        
        return analysis
    
    def _extract_key_points(self, texts: List[str], role: str) -> List[str]:
        """Extract key points relevant to the agent's role."""
        # In a real implementation, this would use NLP to extract key points
        # For now, we'll return a simple summary
        return [
            f"Found {len(texts)} relevant sections related to {role} analysis"
        ]
    
    def _identify_concerns(self, texts: List[str], role: str) -> List[str]:
        """Identify potential concerns relevant to the agent's role."""
        # In a real implementation, this would use NLP to identify concerns
        return []
    
    def _extract_financial_metrics(self, texts: List[str]) -> Dict[str, Any]:
        """Extract financial metrics from the text."""
        # In a real implementation, this would extract actual metrics
        return {
            "metrics_found": [],
            "analysis": "Financial metrics extraction would be implemented here"
        }
    
    def _extract_market_metrics(self, texts: List[str]) -> Dict[str, Any]:
        """Extract market-related metrics from the text."""
        # In a real implementation, this would extract actual metrics
        return {
            "metrics_found": [],
            "analysis": "Market metrics extraction would be implemented here"
        }
