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

from app.services.mongodb_service import MongoDBService

# Initialize MongoDB service for analysis results
mongodb_service = MongoDBService("analysis_results")

async def store_analysis_result(analysis_id: str, status: str, result: Any = None, message: str = None, user_id: str = "system", website_url: Optional[str] = None):
    """Helper function to safely store analysis results"""
    print(f"[DEBUG] Storing analysis result for ID: {analysis_id}, status: {status}")
    
    # Ensure the result is JSON serializable
    result_dict = {}
    if result is not None:
        try:
            json.dumps(result)
            result['analysis_id'] = analysis_id  # Test serialization
            result_dict["result"] = result
        except (TypeError, OverflowError) as e:
            print(f"[WARNING] Result not JSON serializable, converting to string: {str(e)}")
            result_dict["result"] = str(result)
    
    # Prepare the document with proper structure
    document = {
        "analysis_id": analysis_id,
        "website_url": website_url,
        "user_id": user_id,
        "status": status,
        "message": message or "",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Add the result data if available
    if result_dict:
        document["result"] = result_dict.get("result", {})
    
    print(f"[DEBUG] Prepared document for MongoDB: {json.dumps(document, default=str)}")
    
    max_retries = 3
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            print(f"[DEBUG] Attempt {attempt + 1} to save to MongoDB...")
            # Save to MongoDB
            success = await mongodb_service.save_analysis_results(
                analysis_id=analysis_id,
                result_data=document,
                user_id=user_id,
                status=status
            )
            
            if success:
                print(f"[DEBUG] Successfully saved analysis result for ID: {analysis_id}")
                return True
            else:
                print(f"[WARNING] Failed to save analysis result (attempt {attempt + 1}/{max_retries})")
                
        except Exception as e:
            error_msg = f"Error saving analysis result (attempt {attempt + 1}/{max_retries}): {str(e)}"
            print(f"[ERROR] {error_msg}")
            router_logger.error(error_msg, 
                             extra={"analysis_id": analysis_id, "error": str(e), "attempt": attempt + 1})
            
        if attempt < max_retries - 1:
            print(f"[DEBUG] Retrying in {retry_delay} seconds...")
            await asyncio.sleep(retry_delay)
            retry_delay *= 2  # Exponential backoff
    
    print(f"[ERROR] Failed to save analysis result after {max_retries} attempts")
    return False

# Models
class AnalysisRequest(BaseModel):
    pitch: str
    callback_url: Optional[str] = None
    file: Optional[Any] = None
    website_url: Optional[str] = None  # Will hold the UploadFile object  # For webhook notifications

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
        return f"\n{text.strip()}"
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing PDF file: {str(e)}"
        )

async def process_analysis_request(
    pitch: str,
    background_tasks: BackgroundTasks,
    callback_url: Optional[str] = None,
    file: Optional[UploadFile] = None,
    website_url: Optional[str] = None
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
    
    if website_url:
        request.website_url = website_url
    
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
    
    try:
        data = await request.json()
        pitch_text = data.get('pitch', '')
        website_url = data.get('website_url', '')
        file = data.get('file')
        if file:
            pitch_text += await extract_text_from_pdf(file)
        
        return await process_analysis_request(
            pitch=pitch_text,
            background_tasks=background_tasks,
            callback_url=data.get('callback_url'),
            file=file,
            website_url=website_url
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {str(e)}")

async def run_analysis(analysis_id: str, pitch: str, file: Optional[UploadFile] = None, website_url: Optional[str] = None):
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
        
        # Store initial status
        await store_analysis_result(
            analysis_id=analysis_id,
            status="processing",
            message="Starting analysis...",
            website_url=website_url
        )
        
        # Run the committee analysis with progress updates
        start_time = datetime.utcnow()
        await update_progress("Starting analysis...", 10)
        
        # Prepare input data for analysis
        input_data = {
            'pitch': pitch,
            'file': file,  # Pass the file object directly to the committee
            'website_url': website_url  # Include website URL in the analysis data
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
        
        # Store the successful result
        await store_analysis_result(
            analysis_id=analysis_id,
            status="completed",
            result=result,
            message="Analysis completed successfully"
        )
        
        await update_progress("Analysis complete!", 100)
        
        # If there's a webhook URL, notify it
        if analysis_callbacks.get(analysis_id):
            webhook_start = datetime.utcnow()
            try:
                async with httpx.AsyncClient() as client:
                    # Get the stored result to ensure we're sending the latest version
                    stored_result = analysis_results.get(analysis_id, {})
                    response = await client.post(
                        analysis_callbacks[analysis_id],
                        json=stored_result,
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
        error_msg = f"Error during analysis: {str(e)}"
        logger.log_event(
            "analysis_failed",
            error_msg,
            {"error_type": type(e).__name__},
            level="error"
        )
        
        # Store the error using our helper function
        await store_analysis_result(
            analysis_id=analysis_id,
            status="error",
            message=error_msg
        )
        
        # If there's a webhook URL, notify it about the error
        if analysis_callbacks.get(analysis_id):
            try:
                webhook_start = datetime.utcnow()
                async with httpx.AsyncClient() as client:
                    # Get the stored error result to ensure we're sending the latest version
                    stored_result = analysis_results.get(analysis_id, {})
                    response = await client.post(
                        analysis_callbacks[analysis_id],
                        json=stored_result,
                        timeout=10.0
                    )
                    logger.log_event(
                        "error_webhook_sent",
                        "Sent error notification to webhook",
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
    
    # Create a logger for this request
    logger = AgentLogger("api_request", analysis_id)
    
    try:
        # Log the analysis request
        logger.log_event(
            "analysis_requested",
            "Received request to analyze startup pitch",
            {
                "pitch_length": len(request.pitch) if request.pitch else 0,
                "has_file": request.file is not None,
                "has_callback": bool(request.callback_url)
            }
        )
        
        
        # Check if analysis_id already exists
        existing_result = await mongodb_service.get_analysis_results(analysis_id, "system")
        if existing_result:
            logger.log_event(
                "analysis_already_exists",
                f"Analysis with ID {analysis_id} already exists",
                {"result": existing_result}
            )
            return AnalysisResponse(
                id=analysis_id,
                status=existing_result["status"],
                createdAt=existing_result["created_at"],
                summary=existing_result["summary"],
                error=existing_result["error"]
            )

        # Store initial status using our helper function
        await store_analysis_result(
            analysis_id=analysis_id,
            status="processing",
            message="Analysis request received and queued for processing",
            website_url=request.website_url
        )
        
        # Store callback URL if provided
        if request.callback_url:
            analysis_callbacks[analysis_id] = request.callback_url
            logger.log_event(
                "callback_registered",
                f"Registered callback URL: {request.callback_url}",
                {"callback_url": request.callback_url}
            )
        
        # Start the analysis in the background
        background_tasks.add_task(
            run_analysis,
            analysis_id=analysis_id,
            pitch=request.pitch,
            file=request.file,
            website_url=request.website_url
        )
        
        logger.log_event(
            "analysis_started",
            "Background analysis task started",
            {"analysis_id": analysis_id}
        )
        
        # Return immediately with the analysis ID
        return {
            "analysisId": analysis_id,
            "status": "processing",
            "message": "Analysis started. Use the analysisId to check status."
        }
        
    except Exception as e:
        # Log the error
        error_msg = f"Failed to start analysis: {str(e)}"
        logger.log_event(
            "analysis_start_failed",
            error_msg,
            {"error_type": type(e).__name__},
            level="error"
        )
        
        # Store the error state
        await store_analysis_result(
            analysis_id=analysis_id,
            status="error",
            message=error_msg
        )
        
        # Re-raise the exception with a 500 status code
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

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
        # Log the status check with timestamp
        logger.log_event(
            "status_check",
            f"Checking status of analysis: {analysis_id}",
            {"analysis_id": analysis_id, "timestamp": datetime.utcnow().isoformat()}
        )
        
        # Try to get the analysis result from MongoDB
        try:
            # Get the latest result directly from MongoDB
            result = await mongodb_service.get_analysis_results(analysis_id, "system")
            
            if not result:
                logger.log_event(
                    "status_not_found",
                    f"Analysis not found: {analysis_id}",
                    {"analysis_id": analysis_id},
                    level="warning"
                )
                raise HTTPException(
                    status_code=404,
                    detail=f"Analysis with ID {analysis_id} not found"
                )
            
            # Log the raw result for debugging
            logger.log_event(
                "status_raw_result",
                f"Raw result from MongoDB for {analysis_id}",
                {
                    "analysis_id": analysis_id,
                    "status": result.get("status"),
                    "has_result": "result" in result,
                    "keys": list(result.keys()) if isinstance(result, dict) else []
                }
            )
                
            # Log the status being returned
            logger.log_event(
                "status_returned",
                f"Returning status for analysis: {analysis_id}",
                {
                    "analysis_id": analysis_id, 
                    "status": result.get("status"),
                    "has_result": "result" in result,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Determine the status - check both the status field and the presence of results
            status_value = str(result.get("status", "unknown")).lower()
            
            # If we have a result in the database, consider the analysis complete
            if "result" in result and result["result"]:
                status_value = "completed"
            
            # Ensure the result is a dictionary and properly formatted
            result_data = {}
            if "result" in result and result["result"]:
                if isinstance(result["result"], dict):
                    result_data = result["result"]
                else:
                    result_data = {"data": result["result"]}
            
            # Get the most relevant message
            message = str(result.get("message", ""))
            if not message and status_value == "completed":
                message = "Analysis completed successfully"
            elif not message:
                message = f"Analysis is {status_value}"
                
            # Prepare the response
            response_data = {
                "analysisId": str(analysis_id),
                "status": status_value,
                "result": result_data,
                "message": message
            }
            
            # Log the final response being returned
            logger.log_event(
                "response_prepared",
                f"Prepared response for analysis: {analysis_id}",
                {
                    "analysis_id": analysis_id,
                    "status": status_value,
                    "has_result": bool(result_data),
                    "message_length": len(response_data["message"])
                }
            )
            
            # Return the response data
            return response_data
            
        except Exception as e:
            logger.log_event(
                "status_error",
                f"Error fetching analysis status: {str(e)}",
                {"analysis_id": analysis_id, "error": str(e)},
                level="error"
            )
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching analysis status: {str(e)}"
            )
            
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
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while checking analysis status: {str(e)}"
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
