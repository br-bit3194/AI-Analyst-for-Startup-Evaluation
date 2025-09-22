from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from ...services.analysis_service import AnalysisService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class AnalysisRequest(BaseModel):
    pitch: str
    website_url: Optional[str] = None

@router.post("/analyze")
async def analyze_startup(request: AnalysisRequest):
    """
    Analyze a startup pitch and optional website.
    
    - **pitch**: The startup pitch/description
    - **website_url**: Optional website URL to scrape and analyze
    """
    try:
        service = AnalysisService()
        result = await service.analyze_startup(
            pitch=request.pitch,
            website_url=request.website_url
        )
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error in analyze_startup: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_website(website_url: str, query: str, k: int = 5):
    """
    Search within a previously scraped website.
    
    - **website_url**: The website URL to search in
    - **query**: Search query
    - **k**: Number of results to return (default: 5)
    """
    try:
        vector_store = VectorStore()
        if not vector_store.store_exists(website_url):
            raise HTTPException(status_code=404, detail="Website not found in vector store")
            
        results = vector_store.search_similar(website_url, query, k=k)
        return {
            "status": "success",
            "website": website_url,
            "query": query,
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search_website: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
