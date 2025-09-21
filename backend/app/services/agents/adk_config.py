"""
Configuration for ADK-based agents.
"""
from typing import List, Dict, Any
from .adk_agent import ADKAgent

from typing import Optional, Dict, Any, List

# Define tool implementations
async def analyze_financials_impl(
    revenue_growth: float,
    gross_margin: float,
    burn_rate: float,
    runway_months: Optional[float] = None
) -> Dict[str, Any]:
    """Implementation for financial analysis tool."""
    # Calculate runway if not provided
    if runway_months is None and burn_rate > 0:
        # Simple calculation - in a real app, this would use actual cash balance
        runway_months = 12  # Placeholder
    
    return {
        "status": "success",
        "analysis": {
            "revenue_growth_rating": "high" if revenue_growth > 0.3 else "medium" if revenue_growth > 0.1 else "low",
            "gross_margin_rating": "strong" if gross_margin > 0.5 else "moderate" if gross_margin > 0.3 else "weak",
            "runway_rating": "healthy" if (runway_months or 0) > 18 else "adequate" if (runway_months or 0) > 12 else "concerning",
            "recommendation": "Invest with confidence" if revenue_growth > 0.3 and gross_margin > 0.5 else "Proceed with caution"
        },
        "metrics": {
            "revenue_growth": revenue_growth,
            "gross_margin": gross_margin,
            "burn_rate": burn_rate,
            "runway_months": runway_months
        }
    }

async def assess_market_impl(
    tam: str,
    market_growth: float,
    competitors: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Implementation for market assessment tool."""
    return {
        "status": "success",
        "analysis": {
            "market_size_rating": "large" if "billion" in tam.lower() else "medium" if "million" in tam.lower() else "small",
            "growth_potential": "high" if market_growth > 0.2 else "moderate" if market_growth > 0.1 else "low",
            "competitive_landscape": "fragmented" if (competitors and len(competitors) > 5) else "consolidated",
            "recommendation": "Strong market opportunity" if market_growth > 0.15 else "Evaluate further"
        },
        "metrics": {
            "total_addressable_market": tam,
            "market_growth_rate": market_growth,
            "competitor_count": len(competitors) if competitors else 0
        }
    }

# Define tools that can be used by agents
ANALYSIS_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "analyze_financials",
        "description": "Analyze financial statements and metrics",
        "function": analyze_financials_impl,
        "parameters": {
            "type": "object",
            "properties": {
                "revenue_growth": {"type": "number", "description": "Annual revenue growth rate"},
                "gross_margin": {"type": "number", "description": "Gross margin percentage"},
                "burn_rate": {"type": "number", "description": "Monthly burn rate"},
                "runway_months": {"type": "number", "description": "Remaining runway in months"}
            },
            "required": ["revenue_growth", "gross_margin", "burn_rate"]
        }
    },
    {
        "name": "assess_market",
        "description": "Assess market opportunity and competition",
        "function": assess_market_impl,
        "parameters": {
            "type": "object",
            "properties": {
                "tam": {"type": "string", "description": "Total Addressable Market"},
                "market_growth": {"type": "number", "description": "Expected market growth rate"},
                "competitors": {"type": "array", "items": {"type": "string"}, "description": "Main competitors"}
            },
            "required": ["tam", "market_growth"]
        }
    }
]

def create_financial_analyst(project_id: str, location: str = "us-central1") -> ADKAgent:
    """Create a financial analyst agent."""
    # Prepare the instructions
    instructions = """
    You are a senior financial analyst with expertise in startup valuation and financial modeling.
    Your role is to analyze financial statements, metrics, and projections to assess the
    financial health and viability of startup opportunities.
    
    Key responsibilities:
    - Analyze revenue growth and sustainability
    - Evaluate cost structure and unit economics
    - Assess cash flow and runway
    - Identify financial risks and opportunities
    - Provide investment recommendations based on financial metrics
    
    Always provide specific, data-driven insights and explain your reasoning.
    """
    
    # Create the agent with minimal configuration
    agent = ADKAgent(
        name="financial_analyst",
        instructions=instructions,
        tools=[tool for tool in ANALYSIS_TOOLS if tool["name"] == "analyze_financials"],
        model="gemini-1.5-pro",
        project_id=project_id,
        location=location,
        temperature=0.2  # Lower temperature for more focused financial analysis
    )
    
    return agent

def create_market_analyst(project_id: str, location: str = "us-central1") -> ADKAgent:
    """Create a market analyst agent."""
    # Prepare the instructions
    instructions = """
    You are a market research expert specializing in startup ecosystems and industry analysis.
    Your role is to evaluate market opportunities, competitive positioning, and growth potential.
    
    Key responsibilities:
    - Assess market size and growth potential
    - Analyze competitive landscape and differentiation
    - Evaluate product-market fit
    - Identify market trends and timing
    - Assess go-to-market strategy
    
    Provide clear, actionable insights with supporting market data when available.
    """
    
    # Create the agent with minimal configuration
    agent = ADKAgent(
        name="market_analyst",
        instructions=instructions,
        tools=[tool for tool in ANALYSIS_TOOLS if tool["name"] == "assess_market"],
        model="gemini-1.5-pro",
        project_id=project_id,
        location=location,
        temperature=0.3  # Slightly higher temperature for more creative market analysis
    )
    
    return agent

def create_technical_analyst(project_id: str, location: str = "us-central1") -> ADKAgent:
    """Create a technical analyst agent."""
    # Prepare the instructions
    instructions = """
    You are a technical expert with deep knowledge of technology trends and product development.
    Your role is to assess the technical feasibility, innovation, and scalability of startups.
    
    Key responsibilities:
    - Evaluate technical architecture and stack
    - Assess technical team capabilities
    - Analyze intellectual property and technical differentiators
    - Evaluate scalability and technical risks
    - Assess product roadmap and technical vision
    
    Provide specific, technically sound assessments and recommendations.
    """
    
    # Create the agent with minimal configuration
    agent = ADKAgent(
        name="technical_analyst",
        instructions=instructions,
        tools=[],  # No tools for technical analysis
        model="gemini-1.5-pro",
        project_id=project_id,
        location=location
    )
    
    return agent

def create_agent_manager(project_id: str, location: str = "us-central1") -> 'ADKAgentManager':
    """Create and initialize an ADKAgentManager with default agents."""
    from .adk_agent import ADKAgentManager
    
    manager = ADKAgentManager(project_id=project_id, location=location)
    
    # Create and add default agents
    agents = [
        create_financial_analyst(project_id, location),
        create_market_analyst(project_id, location),
        create_technical_analyst(project_id, location)
    ]
    
    for agent in agents:
        manager.add_agent(agent)
    
    return manager
