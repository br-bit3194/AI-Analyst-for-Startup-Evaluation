from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Depends, status, WebSocket, WebSocketDisconnect, File, UploadFile, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import asyncio
import PyPDF2
from io import BytesIO
import uuid
import httpx
from datetime import datetime

from app.services.committee_coordinator import CommitteeCoordinator
from app.utils.agent_logger import AgentLogger
from app.services.analysis_service import AnalysisService
from app.middleware.auth_middleware import get_current_user
from app.services.websocket_manager import websocket_manager
from typing import Optional

# Initialize router
router = APIRouter(prefix="/analysis", tags=["analysis"])

# Initialize committee
committee = CommitteeCoordinator()

# Initialize logger for the analysis router
router_logger = AgentLogger("analysis_router")

# In-memory storage for analysis results and callbacks (in production, use a database)
analysis_results = {}
analysis_callbacks = {}

# Models
class AnalysisRequest(BaseModel):
    pitch: str
    callback_url: Optional[str] = None
    file: Optional[Any] = None  # Will hold the UploadFile object  # For webhook notifications

class AnalysisResponse(BaseModel):
    analysisId: str  # Changed to match frontend expectation
    status: str
    result: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

# WebSocket endpoint
@router.websocket("/ws/status/{analysis_id}")
async def websocket_endpoint(websocket: WebSocket, analysis_id: str):
    """WebSocket endpoint for real-time progress updates"""
    await websocket_manager.connect(analysis_id, websocket)
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(10)
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(analysis_id, websocket)

async def extract_text_from_pdf(file: UploadFile) -> str:
    """Extract text from uploaded PDF file."""
    try:
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(BytesIO(contents))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing PDF file: {str(e)}"
        )

async def process_analysis_request(
    pitch: str,
    background_tasks: BackgroundTasks,
    callback_url: Optional[str] = None,
    file: Optional[UploadFile] = None
):
    """Process analysis request with the given pitch text or file."""
    # Create an AnalysisRequest with the extracted text
    request = AnalysisRequest(
        pitch=pitch,
        callback_url=callback_url
    )
    
    # If file is provided, pass it along with the request
    if file:
        request.file = file
    
    return await evaluate_pitch(request, background_tasks)

@router.post("", 
            response_model=AnalysisResponse,
            status_code=status.HTTP_202_ACCEPTED,
            summary="Start a new analysis",
            response_description="Analysis started successfully")
async def start_analysis(
    request: Request,
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Start a new analysis of a startup pitch.
    
    This endpoint accepts both:
    - JSON payload with 'pitch' and optional 'callback_url'
    - Multipart form with 'file' (PDF) and optional 'callback_url'
    """
    content_type = request.headers.get('content-type', '')
    
    # Handle JSON payload
    if 'application/json' in content_type:
        try:
            data = await request.json()
            return await process_analysis_request(
                pitch=data.get('pitch', ''),
                background_tasks=background_tasks,
                callback_url=data.get('callback_url'),
                file=data.get('file')
            )
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    # Handle file upload (multipart/form-data)
    elif 'multipart/form-data' in content_type:
        form_data = await request.form()
        file = form_data.get('file')
        
        if not file or not hasattr(file, 'filename'):
            raise HTTPException(status_code=400, detail="No file provided")
            
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
            
        # Extract text from PDF
        try:
            pitch_text = await extract_text_from_pdf(file)
            if not pitch_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="The uploaded PDF appears to be empty or could not be read"
                )
                
            return await process_analysis_request(
                pitch=pitch_text,
                background_tasks=background_tasks,
                callback_url=form_data.get('callback_url'),
                file=file  # Pass the file object directly
            )
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while processing the file: {str(e)}"
            )
    
    # Unsupported content type
    raise HTTPException(
        status_code=415,
        detail="Unsupported media type. Use 'application/json' or 'multipart/form-data'"
    )
    """
    Start a new analysis of a startup pitch from a PDF file.
    Returns immediately with an analysis ID that can be used to check the status.
    
    The PDF should contain the startup pitch or business plan to be analyzed.
    """
    # Check if the uploaded file is a PDF
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    # Extract text from PDF
    try:
        pitch_text = await extract_text_from_pdf(file)
        if not pitch_text.strip():
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF appears to be empty or could not be read"
            )
            
        # Create an AnalysisRequest with the extracted text
        request = AnalysisRequest(
            pitch=pitch_text,
            callback_url=callback_url
        )
        
        return await evaluate_pitch(request, background_tasks)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the file: {str(e)}"
        )

async def run_analysis(analysis_id: str, pitch: str, file: Optional[UploadFile] = None):
    """
    Background task to run the analysis with comprehensive logging.
    
    Args:
        analysis_id: Unique ID for this analysis
        pitch: The startup pitch to analyze
        file: Optional uploaded file (PDF) to analyze
    """
    logger = AgentLogger("analysis_worker", analysis_id)
    
    async def update_progress(message: str, progress: int):
        """Helper to send progress updates to WebSocket clients"""
        await websocket_manager.send_progress_update(analysis_id, message, progress)
        logger.log_event("progress_update", message, {"progress": progress})
    
    try:
        # Log analysis start
        logger.log_event(
            "analysis_started",
            "Starting analysis of startup pitch",
            {"pitch_length": len(pitch) if pitch else 0}
        )
        
        # Run the committee analysis with progress updates
        start_time = datetime.utcnow()
        await update_progress("Starting analysis...", 10)
        
        # Prepare input data for analysis
        input_data = {
            'pitch': pitch,
            'file': file  # Pass the file object directly to the committee
        }
        
        # Run analysis with progress tracking
        result = await committee.analyze_pitch_with_progress(
            input_data,
            progress_callback=lambda msg, pct: update_progress(msg, 10 + int(pct * 0.8))  # 10-90% for analysis
        )
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        await update_progress("Finalizing results...", 95)
        
        # Log analysis completion
        try:
            # Safely get the summary, handling cases where it might not be a string
            summary = result.get("summary", "")
            if not isinstance(summary, str):
                summary = str(summary)
            summary_preview = summary[:500] if summary else ""
            
            logger.log_event(
                "analysis_completed",
                "Successfully completed pitch analysis",
                {
                    "duration_seconds": duration,
                    "result_summary": summary_preview
                }
            )
        except Exception as e:
            logger.log_event(
                "analysis_log_error",
                f"Error logging analysis completion: {str(e)}",
                {"error": str(e), "result_type": type(result).__name__},
                level="error"
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
        await update_progress("Analysis complete!", 100)
        
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
        pitch=request.pitch,
        file=request.file
    )
    
    # Return immediately with the analysis ID
    return {
        "analysisId": analysis_id,
        "status": "processing",
        "message": "Analysis started. Use the analysis_id to check status."
    }
    # }

@router.get("/status/{analysis_id}", response_model=AnalysisResponse)
@router.get("/{analysis_id}", response_model=AnalysisResponse, include_in_schema=False)
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
            "message": str(result.get("message", ""))  # Ensure message is always a string
        }
        
        # If status is error, ensure we have a proper error message
        if response["status"] == "error":
            if not response["message"] and response["result"]:
                response["message"] = str(response["result"])
            elif not response["message"]:
                response["message"] = "An unknown error occurred"
        
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

@router.get("/history/list", response_model=List[Dict[str, Any]])
async def get_analysis_history(
    request: Request,
    skip: int = 0,
    limit: int = 10
):
    """
    Get the analysis history for the current user.
    Returns a paginated list of analyses, most recent first.
    """
    # Get the user ID from the request state
    user_id = getattr(request.state, "user_id", None)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Create a logger for this request
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    logger = AgentLogger("analysis_api", request_id)
    
    try:
        # Create analysis service instance
        analysis_service = AnalysisService()
        
        # Log the history request
        logger.log_event(
            "history_request",
            f"Fetching analysis history for user {user_id}",
            {"skip": skip, "limit": limit}
        )
        
        # Get analyses from the database
        analyses = await analysis_service.storage.list_analyses(
            user_id=user_id,
            skip=skip,
            limit=limit
        )
        
        # Format the response
        formatted_analyses = []
        for analysis in analyses:
            formatted = {
                "id": str(analysis.get("_id", "")),
                "createdAt": analysis.get("created_at"),
                "status": analysis.get("status", "unknown"),
                "pitch_preview": (analysis.get("input", {}).get("pitch", "")[:100] + "...") if analysis.get("input", {}).get("pitch") else "",
                "website_url": analysis.get("input", {}).get("website_url"),
                "summary": analysis.get("summary", {})
            }
            
            # Add analysis metrics if available
            if analysis.get("analysis"):
                formatted["metrics"] = {
                    "score": analysis["analysis"].get("score"),
                    "sentiment": analysis["analysis"].get("sentiment")
                }
            
            formatted_analyses.append(formatted)
        
        logger.log_event(
            "history_response",
            f"Returning {len(formatted_analyses)} analyses"
        )
        
        return formatted_analyses
        
    except Exception as e:
        logger.log_event(
            "history_error",
            f"Error fetching analysis history: {str(e)}",
            {"error_type": type(e).__name__},
            level="error"
        )
        raise HTTPException(status_code=500, detail=str(e))
