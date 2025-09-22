from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import logging

from ..services.analysis_service import AnalysisService
from ..api.dependencies import get_analysis_service

router = APIRouter()
logger = logging.getLogger(__name__)

class AnalysisRequest(BaseModel):
    pitch: str
    website_url: Optional[str] = None

@router.post("/analyze", response_model=dict)
async def analyze_startup(
    analysis_request: AnalysisRequest,
    request: Request,
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """
    Analyze a startup pitch and optional website.
    
    - **pitch**: The startup pitch/description
    - **website_url**: Optional website URL to scrape and analyze
    """
    try:
        # Start timing the analysis
        start_time = datetime.utcnow()
        
        # Get user ID from request state (assuming it's set by auth middleware)
        user_id = getattr(request.state, 'user_id', 'anonymous')
        
        # Process the analysis
        result = await analysis_service.analyze_startup(
            user_id=user_id,
            pitch=analysis_request.pitch,
            website_url=analysis_request.website_url
        )
        
        # Calculate duration
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        # Prepare the response
        response = {
            "success": True,
            "data": {
                **result,
                "analysisId": f"analysis_{int(start_time.timestamp())}",
                "status": "completed",
                "startTime": start_time.isoformat(),
                "durationSeconds": duration
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error in analyze_startup: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze startup: {str(e)}"
        )
