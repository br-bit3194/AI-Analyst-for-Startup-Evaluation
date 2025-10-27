import asyncio
import time
import json
import logging
from typing import Optional, Dict, Any
from app.config import settings
from fastapi import HTTPException
from .vertex_ai_service import VertexAIService

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Vertex AI service
vertex_ai_service = VertexAIService()

# Rate limiting variables
last_call_time = 0
RATE_LIMIT_DELAY = 30  # 30 seconds between calls to stay under free tier limit

def _parse_vertexai_error(error: Exception) -> Dict[str, Any]:
    """Parse Vertex AI error messages to extract useful information."""
    error_str = str(error).lower()
    if "quota" in error_str or "rate limit" in error_str:
        return {
            "error_type": "rate_limit",
            "message": "API rate limit exceeded. Please wait before making more requests.",
            "details": str(error)
        }
    elif "permission" in error_str or "credentials" in error_str:
        return {
            "error_type": "authentication",
            "message": "Authentication error. Please check your Google Cloud credentials.",
            "details": str(error)
        }
    else:
        return {
            "error_type": "api_error",
            "message": "Error calling Vertex AI API",
            "details": str(error)
        }

async def call_llm(system_prompt: str, user_prompt: str, model: str = "gemini-2.5-pro") -> str:
    """
    Unified LLM call with rate limiting and error handling using Vertex AI.
    
    Args:
        system_prompt: The system prompt/instructions for the LLM
        user_prompt: The user's input prompt
        model: The model to use (defaults to gemini-2.5-pro)
        
    Returns:
        str: The generated response or a JSON string with error information
    """
    global last_call_time
    
    # Rate limiting
    current_time = time.time()
    time_since_last_call = current_time - last_call_time
    if time_since_last_call < RATE_LIMIT_DELAY:
        wait_time = RATE_LIMIT_DELAY - time_since_last_call
        await asyncio.sleep(wait_time)
    
    try:
        # Update last call time
        last_call_time = time.time()
        
        # Use the VertexAIService to make the LLM call
        response = await vertex_ai_service.call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model
        )
        
        return response
            
    except Exception as e:
        error_info = _parse_vertexai_error(e)
        logger.error(f"Error calling Vertex AI API: {error_info}")
        
        # Return a JSON string with error information instead of raising an exception
        error_response = {
            "error": error_info["message"],
            "error_type": error_info["error_type"],
            "details": error_info.get("details", ""),
            "success": False,
            "confidence": 0.0
        }
        return json.dumps(error_response)

def _get_fallback_response() -> str:
    """Return a properly formatted fallback response when API calls fail."""
    fallback_response = {
        "competitive_landscape": {
            "direct_competitors": [
                {
                    "name": "Example Competitor",
                    "strengths": ["Established brand", "Large customer base"],
                    "weaknesses": ["Slow innovation", "High costs"],
                    "differentiation": "Our solution offers better integration and lower costs"
                }
            ],
            "market_position": {
                "positioning": "Innovative solution in a growing market",
                "unique_value_prop": "Simpler, more cost-effective alternative to existing solutions",
                "moat": "Proprietary technology and first-mover advantage"
            },
            "barriers_to_entry": {
                "existing": ["Technology stack", "Regulatory requirements"],
                "potential": ["New technologies", "Established competitors expanding"]
            },
            "threat_analysis": {
                "incumbent_threats": ["Price wars", "Feature matching"],
                "new_entrant_risks": ["Disruptive technologies"],
                "substitute_products": ["Alternative solutions"]
            }
        },
        "confidence": 75.0,
        "warning": "This is a fallback response. The actual API call failed or is not configured.",
        "recommendations": [
            "Check your Vertex AI configuration in the .env file",
            "Verify that the Vertex AI API is enabled in your Google Cloud project",
            "Ensure you have sufficient quota for the Vertex AI API"
        ]
    }
    return json.dumps(fallback_response, indent=2)