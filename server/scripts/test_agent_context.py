import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.agent_context_service import AgentContextService
from app.services.vector_store import VectorStore

async def test_agent_context():
    """Test the agent context service with a sample query."""
    # Initialize services
    vector_store = VectorStore()
    agent_service = AgentContextService(vector_store=vector_store)
    
    # Test parameters
    startup_id = "test_startup_123"
    agent_role = "financial_analyst"
    query = "What are the key financial metrics?"
    
    print(f"Testing agent context service with:")
    print(f"- Startup ID: {startup_id}")
    print(f"- Agent Role: {agent_role}")
    print(f"- Query: {query}")
    print("-" * 50)
    
    # Get agent context
    try:
        context = await agent_service.get_agent_context(
            startup_id=startup_id,
            agent_role=agent_role,
            query=query,
            top_k=3,
            threshold=0.5
        )
        
        # Print results
        print("\nAgent Context Results:")
        print("-" * 50)
        print(f"Enhanced Query: {context.get('enhanced_query')}")
        print(f"Relevant Chunks Found: {len(context.get('relevant_chunks', []))}")
        
        if context.get('relevant_chunks'):
            print("\nTop Chunks:")
            for i, chunk in enumerate(context['relevant_chunks'][:3], 1):
                print(f"\nChunk {i} (Score: {chunk['score']:.2f}):")
                print(f"Text: {chunk['text'][:200]}...")
                if chunk.get('metadata'):
                    print(f"Metadata: {chunk['metadata']}")
        
        if context.get('analysis'):
            print("\nAnalysis:")
            for key, value in context['analysis'].items():
                print(f"- {key}: {value}")
                
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent_context())
