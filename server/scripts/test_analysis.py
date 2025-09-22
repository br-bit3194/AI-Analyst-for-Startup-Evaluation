import asyncio
import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.services.analysis_service import AnalysisService
from app.services.web_scraper import WebScraper
from app.services.vector_store import VectorStore

async def test_web_scraper():
    print("Testing WebScraper...")
    scraper = WebScraper()
    
    # Test with a sample URL
    test_url = "https://www.ycombinator.com/"
    print(f"Scraping {test_url}...")
    
    try:
        content = scraper.get_website_content(test_url)
        print(f"Successfully scraped {len(content)} characters")
        print("Content preview:")
        print(content[:500] + "...")
        return True
    except Exception as e:
        print(f"Error scraping website: {str(e)}")
        return False

async def test_vector_store():
    print("\nTesting VectorStore...")
    vector_store = VectorStore()
    
    # Test data
    test_url = "https://www.ycombinator.com/"
    test_content = """
    Y Combinator (YC) is an American technology startup accelerator launched in March 2005.
    It has been used to launch more than 2,000 companies, including Stripe, Airbnb, 
    Cruise, PagerDuty, DoorDash, Coinbase, Instacart, and Dropbox.
    """
    
    try:
        # Test creating a store
        store_id = vector_store.create_store(test_url, test_content)
        print(f"Created store with ID: {store_id}")
        
        # Test searching
        query = "What is Y Combinator known for?"
        print(f"Searching for: {query}")
        results = vector_store.search_similar(test_url, query, k=1)
        
        print("Search results:")
        for i, result in enumerate(results, 1):
            print(f"{i}. Score: {result['score']:.4f}")
            print(f"   Text: {result['text'][:200]}...")
            
        return True
    except Exception as e:
        print(f"Error testing vector store: {str(e)}")
        return False

async def test_analysis_service():
    print("\nTesting AnalysisService...")
    service = AnalysisService()
    
    test_pitch = """
    Our startup, Example AI, is building an AI-powered platform that helps 
    businesses automate their customer support. We use state-of-the-art 
    natural language processing to understand and respond to customer queries 
    with human-like accuracy. We're currently in beta with 10 paying customers 
    and growing 20% month over month.
    """
    
    test_website = "https://www.ycombinator.com/"
    
    try:
        print("Testing with pitch only...")
        result = await service.analyze_startup(
            pitch=test_pitch,
            website_url=None
        )
        print("Pitch analysis successful!")
        print(f"Pitch length: {len(test_pitch)} characters")
        
        print("\nTesting with website...")
        result = await service.analyze_startup(
            pitch=test_pitch,
            website_url=test_website
        )
        print("Website analysis successful!")
        
        return True
    except Exception as e:
        print(f"Error testing analysis service: {str(e)}")
        return False

async def main():
    print("Starting integration tests...\n")
    
    # Run tests
    web_scraper_ok = await test_web_scraper()
    vector_store_ok = await test_vector_store()
    analysis_service_ok = await test_analysis_service()
    
    # Print summary
    print("\n=== Test Summary ===")
    print(f"Web Scraper: {'✓' if web_scraper_ok else '✗'}")
    print(f"Vector Store: {'✓' if vector_store_ok else '✗'}")
    print(f"Analysis Service: {'✓' if analysis_service_ok else '✗'}")
    
    if all([web_scraper_ok, vector_store_ok, analysis_service_ok]):
        print("\nAll tests passed successfully!")
        return 0
    else:
        print("\nSome tests failed. Check the logs above for details.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
