from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import asyncio
import uuid
import httpx
from datetime import datetime

from app.services.committee_coordinator import CommitteeCoordinator
from app.utils.agent_logger import AgentLogger

router = APIRouter(prefix="/analysis", tags=["analysis"])
committee = CommitteeCoordinator()

# Initialize logger for the analysis router
router_logger = AgentLogger("analysis_router")

# In-memory storage for analysis results and callbacks (in production, use a database)
analysis_results = {}
analysis_callbacks = {}

class AnalysisRequest(BaseModel):
    pitch: str
    callback_url: Optional[str] = None  # For webhook notifications

class AnalysisResponse(BaseModel):
    analysisId: str  # Changed to match frontend expectation
    status: str
    result: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

async def run_analysis(analysis_id: str, pitch: str):
    """
    Background task to run the analysis with comprehensive logging.
    
    Args:
        analysis_id: Unique ID for this analysis
        pitch: The startup pitch to analyze
    """
    logger = AgentLogger("analysis_worker", analysis_id)
    
    try:
        # Log analysis start
        logger.log_event(
            "analysis_started",
            "Starting analysis of startup pitch",
            {"pitch_length": len(pitch) if pitch else 0}
        )
        
        # Run the committee analysis
        start_time = datetime.utcnow()
        result = await committee.analyze_pitch(pitch)
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        # Log analysis completion
        logger.log_event(
            "analysis_completed",
            "Successfully completed pitch analysis",
            {
                "duration_seconds": duration,
                "result_summary": result.get("summary", "")[:500]  # Log first 500 chars of summary
            }
        )
        
        # Format the result
        formatted_result = {
            "analysisId": analysis_id,
            "status": "completed",
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store the result
        analysis_results[analysis_id] = formatted_result
        
        # If there's a webhook URL, notify it
        if analysis_callbacks.get(analysis_id):
            webhook_start = datetime.utcnow()
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        analysis_callbacks[analysis_id],
                        json=formatted_result,
                        timeout=10.0
                    )
                    logger.log_event(
                        "webhook_sent",
                        f"Successfully sent webhook to {analysis_callbacks[analysis_id]}",
                        {
                            "status_code": response.status_code,
                            "duration_seconds": (datetime.utcnow() - webhook_start).total_seconds()
                        }
                    )
            except Exception as e:
                logger.log_event(
                    "webhook_failed",
                    f"Failed to send webhook: {str(e)}",
                    level="error"
                )
    
    except Exception as e:
        # Log the error
        logger.log_event(
            "analysis_failed",
            f"Error during analysis: {str(e)}",
            {"error_type": type(e).__name__},
            level="error"
        )
        
        # Store the error
        error_result = {
            "analysisId": analysis_id,
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        analysis_results[analysis_id] = error_result
        
        # If there's a webhook URL, notify it about the error
        if analysis_callbacks.get(analysis_id):
            try:
                webhook_start = datetime.utcnow()
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        analysis_callbacks[analysis_id],
                        json=error_result,
                        timeout=10.0
                    )
                    logger.log_event(
                        "error_webhook_sent",
                        f"Sent error notification to webhook",
                        {
                            "status_code": response.status_code,
                            "duration_seconds": (datetime.utcnow() - webhook_start).total_seconds()
                        }
                    )
            except Exception as webhook_error:
                logger.log_event(
                    "error_webhook_failed",
                    f"Failed to send error webhook: {str(webhook_error)}",
                    level="error"
                )

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
    
    # Store callback URL if provided
    if request.callback_url:
        analysis_callbacks[analysis_id] = request.callback_url
    
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
async def get_analysis_status(analysis_id: str, request: Request):
    """
    Get the status of a previously started analysis.
    
    Args:
        analysis_id: The ID of the analysis to check
        request: The incoming request (for logging)
    """
    # Create a logger for this request
    request_id = request.state.request_id if hasattr(request.state, 'request_id') else str(uuid.uuid4())
    logger = AgentLogger("analysis_api", request_id)
    
    try:
        # Log the status check
        logger.log_event(
            "status_check",
            f"Checking status of analysis: {analysis_id}",
            {"analysis_id": analysis_id}
        )
        
        # Get the analysis result
        result = analysis_results.get(analysis_id)
        
        if not result:
            logger.log_event(
                "status_not_found",
                f"Analysis ID not found: {analysis_id}",
                level="warning"
            )
            raise HTTPException(
                status_code=404,
                detail=f"Analysis with ID {analysis_id} not found"
            )
        
        # Log the status being returned
        logger.log_event(
            "status_returned",
            f"Returning status for analysis: {analysis_id} - {result.get('status')}",
            {"status": result.get("status")}
        )
        
        # Format the response
        response = {
            "analysisId": analysis_id,
            "status": result.get("status", "unknown"),
            "result": result.get("result"),
            "message": result.get("message")
        }
        
        # Format the summary if it exists
        if response.get("result") and isinstance(response["result"], dict) and "summary" in response["result"]:
            summary = response["result"]["summary"]
            if isinstance(summary, dict):
                response["result"]["summary"] = {
                    'keyInsights': summary.get('key_insights', summary.get('keyInsights', [])),
                    'strengths': summary.get('strengths', []),
                    'concerns': summary.get('concerns', []),
                    'recommendations': summary.get('recommendations', [])
                }
        
        return response
        
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.log_event(
            "status_check_error",
            f"Error checking status of analysis {analysis_id}: {str(e)}",
            {"error_type": type(e).__name__},
            level="error"
        )
        raise HTTPException(status_code=500, detail=str(e))
