"""
Example usage of the ADK-based agent system.
"""
import asyncio
import os
import logging
from dotenv import load_dotenv
from app.services.agents.adk_config import create_agent_manager
from app.services.agents.adk_agent import ADKAgent, AgentResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def main():
    # Get configuration from environment variables
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    
    if not project_id:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable must be set")
    
    # Create agent manager with default agents
    logger.info("Initializing agent manager...")
    manager = create_agent_manager(project_id, location)
    
    # Example startup analysis
    startup_info = {
        "company_name": "TechStart Inc.",
        "industry": "AI/ML Infrastructure",
        "stage": "Series A",
        "revenue": 1500000,
        "growth_rate": 0.25,
        "burn_rate": 200000,
        "team_size": 15,
        "founding_year": 2020
    }
    
    # Analyze the startup using all agents
    question = """
    Please analyze this startup and provide your assessment.
    Focus on the financial viability, market potential, and technical strength.
    """
    
    logger.info("Analyzing startup with all agents...")
    results = await manager.orchestrate(
        message=question,
        context=startup_info
    )
    
    # Print results
    for agent_name, response in results.items():
        print(f"\n=== {agent_name.upper()} ===")
        print(response.content)
        print("-" * 80)
    
    # Example of using a single agent
    logger.info("\nGetting detailed financial analysis...")
    response = await manager.process_message(
        agent_name="financial_analyst",
        message="""
        Please provide a detailed financial analysis including:
        1. Current financial health
        2. Key risks and opportunities
        3. Funding recommendations
        """,
        context=startup_info
    )
    
    print("\n=== DETAILED FINANCIAL ANALYSIS ===")
    print(response.content)

if __name__ == "__main__":
    asyncio.run(main())
