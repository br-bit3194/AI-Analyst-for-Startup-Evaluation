"""
Configuration for the multi-agent system using Google's Generative AI.
"""
from typing import List, Dict, Any
from .agent_manager import AgentConfig

# Define tools that can be used by agents (simplified for Gemini)
ANALYSIS_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "analyze_financials",
        "description": "Analyze financial statements and metrics",
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

# Define the agents for our system
AGENT_CONFIGS: List[AgentConfig] = [
    AgentConfig(
        name="financial_analyst",
        description="Analyzes financial health and projections of startups",
        instructions="""
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
        """,
        tools=ANALYSIS_TOOLS,
        model="gemini-1.5-pro",
        temperature=0.1,
        project="${GOOGLE_CLOUD_PROJECT}",  # Will be replaced with actual project ID
        location="${GOOGLE_CLOUD_LOCATION}"  # Will be replaced with actual location
    ),
    AgentConfig(
        name="market_analyst",
        description="Analyzes market opportunities and competitive landscape",
        instructions="""
        You are a market research expert specializing in startup ecosystems and industry analysis.
        Your role is to evaluate market opportunities, competitive positioning, and growth potential.
        
        Key responsibilities:
        - Assess market size and growth potential
        - Analyze competitive landscape and differentiation
        - Evaluate product-market fit
        - Identify market trends and timing
        - Assess go-to-market strategy
        
        Provide clear, actionable insights with supporting market data when available.
        """,
        tools=ANALYSIS_TOOLS,
        model="gemini-1.5-pro",
        temperature=0.1,
        project="${GOOGLE_CLOUD_PROJECT}",
        location="${GOOGLE_CLOUD_LOCATION}"
    ),
    AgentConfig(
        name="technical_analyst",
        description="Evaluates technical aspects and innovation potential",
        instructions="""
        You are a technical expert with deep knowledge of technology trends and product development.
        Your role is to assess the technical feasibility, innovation, and scalability of startups.
        
        Key responsibilities:
        - Evaluate technical architecture and stack
        - Assess technical team capabilities
        - Analyze intellectual property and technical differentiators
        - Evaluate scalability and technical risks
        - Assess product roadmap and technical vision
        
        Provide specific, technically sound assessments and recommendations.
        """,
        tools=[],  # No tools needed for technical analysis
        model="gemini-1.5-pro",
        temperature=0.1,
        project="${GOOGLE_CLOUD_PROJECT}",
        location="${GOOGLE_CLOUD_LOCATION}"
    )
]

def get_agent_configs(project_id: str, location: str) -> List[AgentConfig]:
    """Get agent configurations with resolved project and location.
    
    Args:
        project_id: Google Cloud project ID
        location: Google Cloud location/region
        
    Returns:
        List of AgentConfig instances with resolved project and location
    """
    import os
    import copy
    
    # Make a deep copy to avoid modifying the original configs
    configs = copy.deepcopy(AGENT_CONFIGS)
    
    for config in configs:
        # Replace placeholders with actual values
        if config.project == "${GOOGLE_CLOUD_PROJECT}":
            config.project = project_id or os.getenv("GOOGLE_CLOUD_PROJECT")
        if config.location == "${GOOGLE_CLOUD_LOCATION}":
            config.location = location or os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    
    return configs

# Configuration for the agent manager
AGENT_MANAGER_CONFIG = {
    "project_id": "${GOOGLE_CLOUD_PROJECT}",  # Will be replaced with actual project ID
    "location": "${GOOGLE_CLOUD_LOCATION}"    # Will be replaced with actual location
}

# Configuration for the orchestration layer
ORCHESTRATION_CONFIG = {
    "default_agents": ["financial_analyst", "market_analyst", "technical_analyst"],
    "response_format": {
        "sections": [
            "executive_summary",
            "financial_analysis",
            "market_analysis",
            "technical_analysis",
            "risk_assessment",
            "recommendations"
        ],
        "max_length": 2000
    }
}
