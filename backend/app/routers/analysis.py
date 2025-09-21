from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json, asyncio
import uuid
from app.services.committee_coordinator import CommitteeCoordinator

router = APIRouter(prefix="/analysis", tags=["analysis"])
committee = CommitteeCoordinator()

# In-memory storage for analysis results (in production, use a database)
analysis_results = {}

class AnalysisRequest(BaseModel):
    pitch: str
    callback_url: Optional[str] = None  # For webhook notifications

class AnalysisResponse(BaseModel):
    analysisId: str  # Changed to match frontend expectation
    status: str
    result: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

async def run_analysis(analysis_id: str, pitch: str):
    """Background task to run the analysis."""
    try:
        # Run the committee analysis
        result = await committee.analyze_pitch(pitch)
        
        # Ensure the result is in the correct format with camelCase field names
        formatted_result = {}
        if 'final_verdict' in result:
            verdict = result['final_verdict']
            formatted_result['finalVerdict'] = {
                'recommendation': verdict.get('recommendation'),
                'confidence': verdict.get('confidence'),
                'confidenceLabel': verdict.get('confidence_label'),
                'reasons': verdict.get('reasons', []),
                'timestamp': verdict.get('timestamp')
            }
            
        if 'summary' in result:
            summary = result['summary']
            formatted_result['summary'] = {
                'keyInsights': summary.get('key_insights', []),
                'strengths': summary.get('strengths', []),
                'concerns': summary.get('concerns', []),
                'recommendations': summary.get('recommendations', [])
            }
            
        analysis_results[analysis_id] = {
            'status': 'completed',
            'result': formatted_result
        }
        
        # In a real app, you would also:
        # 1. Store the result in a database
        # 2. Send a webhook notification if callback_url was provided
        # 3. Update any real-time interfaces
        
    except Exception as e:
        analysis_results[analysis_id] = {
            'status': 'error',
            'error': str(e),
            'result': None,
            'message': f'Analysis failed: {str(e)}'
        }

@router.post("/evaluate", response_model=AnalysisResponse)
async def evaluate_pitch(
    request: AnalysisRequest, 
    background_tasks: BackgroundTasks
):
    """
    Start an analysis of a startup pitch.
    Returns immediately with an analysis ID that can be used to check the status.
    """
    # Generate a unique ID for this analysis
    analysis_id = str(uuid.uuid4())
    
    # Store initial status
    analysis_results[analysis_id] = {
        'status': 'processing',
        'started_at': str(asyncio.get_event_loop().time())
    }
    
    # Start the analysis in the background
    background_tasks.add_task(
        run_analysis,
        analysis_id=analysis_id,
        pitch=request.pitch
    )
    
    return {
        "analysisId": analysis_id,
        "status": "processing",
        "message": "Analysis started. Use the analysis_id to check status."
    }

@router.get("/status/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis_status(analysis_id: str):
    """Get the status of a previously started analysis."""
    result = analysis_results.get(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    response = {
        "analysisId": analysis_id,
        "status": result['status'],
        "result": result.get('result'),
        "message": result.get('error')
    }
    
    # Transform snake_case to camelCase in the result if it exists
    if 'result' in result and result['result']:
        if 'final_verdict' in result['result']:
            verdict = result['result']['final_verdict']
            response['result']['finalVerdict'] = {
                'recommendation': verdict.get('recommendation'),
                'confidence': verdict.get('confidence'),
                'confidenceLabel': verdict.get('confidence_label'),
                'reasons': verdict.get('reasons', []),
                'timestamp': verdict.get('timestamp')
            }
            del response['result']['final_verdict']
            
        if 'summary' in result['result']:
            summary = result['result']['summary']
            response['result']['summary'] = {
                'keyInsights': summary.get('key_insights', []),
                'strengths': summary.get('strengths', []),
                'concerns': summary.get('concerns', []),
                'recommendations': summary.get('recommendations', [])
            }
    
    return response
