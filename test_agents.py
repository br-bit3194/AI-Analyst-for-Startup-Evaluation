#!/usr/bin/env python3
"""
Simple test to check if the ADK agents are working properly.
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_agent():
    """Test if the ADK agents can be created and used."""
    try:
        from app.services.agents import create_financial_analyst, create_market_analyst, create_technical_analyst
        from app.config import settings

        print("Testing ADK agent creation...")

        # Try to create agents
        project_id = settings.GOOGLE_CLOUD_PROJECT or "test-project"
        location = settings.GOOGLE_CLOUD_LOCATION or "us-central1"

        print(f"Using project_id: {project_id}")
        print(f"Using location: {location}")

        # Create agents
        financial_agent = create_financial_analyst(project_id, location)
        market_agent = create_market_analyst(project_id, location)
        technical_agent = create_technical_analyst(project_id, location)

        print("Agents created successfully:")
        print(f"  - Financial analyst: {financial_agent.name}")
        print(f"  - Market analyst: {market_agent.name}")
        print(f"  - Technical analyst: {technical_agent.name}")

        # Test a simple message
        test_pitch = "Test startup pitch for debugging"

        print("\nTesting agent processing...")

        # Test financial analyst
        response = await financial_agent.process_message(test_pitch)
        print(f"Financial analyst response success: {response.success}")
        print(f"Financial analyst content: {response.content[:200]}...")

        if not response.success:
            print(f"Financial analyst error: {response.error}")

        return True

    except Exception as e:
        print(f"Error testing agents: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_agent())
    if result:
        print("\n✅ Agent test completed successfully")
    else:
        print("\n❌ Agent test failed")
        sys.exit(1)
