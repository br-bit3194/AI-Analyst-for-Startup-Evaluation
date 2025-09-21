import time
import uuid
import asyncio
from datetime import datetime
from fastapi import FastAPI, APIRouter, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Callable, Awaitable
import traceback
import logging

from app.db.mongodb import db_client
from app.services.metadata_service import metadata_service
from app.middleware import MetadataMiddleware, MetadataRoute
from app.routers import (
    upload, 
    documents, 
    debate, 
    seed, 
    finance, 
    analysis, 
    deal_analysis, 
    verdict, 
    startup_analysis,
    agent_context
)
from app.logging_config import setup_logger, get_agent_logger

# Initialize root logger
logger = setup_logger("api")

# Create a parent router for all API routes
api_router = APIRouter(prefix="/api")

# Include all routers under the /api prefix
api_router.include_router(upload.router)
api_router.include_router(documents.router)
api_router.include_router(debate.router)
api_router.include_router(seed.router)
api_router.include_router(finance.router)
api_router.include_router(analysis.router)
api_router.include_router(deal_analysis.router)
api_router.include_router(verdict.router)
api_router.include_router(startup_analysis.router)
api_router.include_router(agent_context.router, prefix="/agent", tags=["agent"])

# Create FastAPI app with custom route class
app = FastAPI(
    title="Startup AI Backend",
    route_class=MetadataRoute
)

# Add metadata middleware
app.add_middleware(MetadataMiddleware)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next: Callable[[Request], Awaitable[Response]]):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={"request_id": request_id, "agent_id": "api"}
    )
    
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(
            f"Request failed: {str(e)}",
            exc_info=True,
            extra={"request_id": request_id, "agent_id": "api"}
        )
        raise
    
    # Calculate processing time
    process_time = (time.time() - start_time) * 1000
    formatted_process_time = f"{process_time:.2f}ms"
    
    # Log response
    logger.info(
        f"Response: {response.status_code} in {formatted_process_time}",
        extra={
            "request_id": request_id,
            "agent_id": "api",
            "status_code": response.status_code,
            "duration": process_time
        }
    )
    
    return response

@app.on_event("startup")
async def startup_event():
    """Handle application startup."""
    try:
        # Initialize database connection
        await db_client.connect_db()
        
        # Clean up any old metadata on startup
        await metadata_service.cleanup_old_metadata(max_age_hours=24)
        
        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Handle application shutdown."""
    try:
        # Clean up all metadata on shutdown
        await metadata_service.cleanup_all_metadata()
        
        # Close database connection
        await db_client.close_db()
        
        logger.info("Application shutdown complete")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Mount the API router
app.include_router(api_router)

# Add CORS (optional, helps with frontend testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler to capture 500 stacktraces
@app.exception_handler(Exception)
async def exception_handler(request: Request, exc: Exception):
    request_id = request.state.request_id if hasattr(request.state, 'request_id') else 'unknown'
    logger.error(
        f"Unhandled exception: {str(exc)}",
        exc_info=True,
        extra={"request_id": request_id, "agent_id": "api"}
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": request_id},
    )