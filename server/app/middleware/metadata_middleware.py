from fastapi import Request, Response
from fastapi.routing import APIRoute
from typing import Callable, Awaitable
import uuid
import time
import asyncio
import logging
from typing import Optional, Any, Dict
from starlette.types import ASGIApp, Scope, Receive, Send, Message
from fastapi import Request, Response
from fastapi.routing import APIRoute
from datetime import datetime

from ..services.metadata_service import metadata_service

logger = logging.getLogger(__name__)

class MetadataMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request = Request(scope, receive=receive)
        request_id = str(uuid.uuid4())
        
        # Add request ID to request state
        request.state.request_id = request_id
        
        # Create metadata for this request
        metadata = {
            "method": request.method,
            "url": str(request.url),
            "headers": dict(request.headers),
            "query_params": dict(request.query_params),
            "start_time": time.time()
        }
        
        # Store the metadata
        await metadata_service.create_metadata(request_id, metadata)
        
        # Process the request and handle response
        try:
            response = await self.app(scope, receive, send)
            
            # Only update metadata if we have a valid response
            if response is not None:
                # Get status code safely
                status_code = getattr(response, 'status_code', 200)
                
                # Update metadata with response info
                metadata.update({
                    "status_code": status_code,
                    "duration_seconds": time.time() - metadata["start_time"],
                    "end_time": time.time().isoformat()
                })
                
                # Re-save the metadata with response info
                await metadata_service.create_metadata(request_id, metadata)
                
                # Clean up the metadata after a short delay
                # This ensures the client has received the response
                # but doesn't block the response
                async def delayed_cleanup():
                    try:
                        await asyncio.sleep(5)  # Wait 5 seconds before cleanup
                        await metadata_service.cleanup_metadata(request_id)
                    except Exception as e:
                        logger.error(f"Error in metadata cleanup: {e}")
                
                asyncio.create_task(delayed_cleanup())
            
            return response
            
        except Exception as e:
            # Log the error and update metadata with error info
            logger.error(f"Error in request processing: {e}")
            metadata.update({
                "status_code": 500,
                "error": str(e),
                "duration_seconds": time.time() - metadata["start_time"],
                "end_time": datetime.now().isoformat()
            })
            await metadata_service.create_metadata(request_id, metadata)
            
            # Re-raise the exception to be handled by FastAPI's error handling
            raise

class MetadataRoute(APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            # Add request ID to request state if not already set
            if not hasattr(request.state, 'request_id'):
                request.state.request_id = str(uuid.uuid4())
            return await original_route_handler(request)

        return custom_route_handler
