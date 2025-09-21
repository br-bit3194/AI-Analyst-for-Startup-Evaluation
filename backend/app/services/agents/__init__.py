"""
Multi-agent system for startup evaluation using Google's Agent Development Kit (ADK).

This package provides a framework for creating and managing specialized AI agents
to evaluate startup investment opportunities using Google's Agent Development Kit.
"""

# ADK-based agent system
from .adk_agent import ADKAgent, AgentResponse, ADKAgentManager
from .adk_config import (
    create_financial_analyst,
    create_market_analyst,
    create_technical_analyst,
    create_agent_manager,
    ANALYSIS_TOOLS
)

__all__ = [
    # ADK-based agent system
    'ADKAgent',
    'AgentResponse',
    'ADKAgentManager',
    'create_financial_analyst',
    'create_market_analyst',
    'create_technical_analyst',
    'create_agent_manager',
    'ANALYSIS_TOOLS'
]
