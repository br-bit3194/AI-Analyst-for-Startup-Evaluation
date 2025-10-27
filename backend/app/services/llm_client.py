import asyncio
import time
import json
from typing import Optional, Dict, Any
from app.config import settings
from fastapi import HTTPException

# Rate limiting variables
last_call_time = 0
RATE_LIMIT_DELAY = 30  # 30 seconds between calls to stay under free tier limit

try:
    import google.generativeai as genai
except Exception:
    genai = None

def _parse_gemini_error(error: Exception) -> Dict[str, Any]:
    """Parse Gemini API error messages to extract useful information."""
    error_str = str(error).lower()
    if "quota" in error_str or "rate limit" in error_str:
        return {
            "error_type": "rate_limit",
            "message": "API rate limit exceeded. Please wait before making more requests.",
            "details": str(error)
        }
    elif "api key" in error_str:
        return {
            "error_type": "authentication",
            "message": "Invalid or missing API key",
            "details": str(error)
        }
    else:
        return {
            "error_type": "api_error",
            "message": "Error calling Gemini API",
            "details": str(error)
        }

async def call_llm(system_prompt: str, user_prompt: str, model: str = "gemini-1.5-flash") -> str:
    """
    Unified LLM call with rate limiting and error handling.
    
    Args:
        system_prompt: The system prompt/instructions for the LLM
        user_prompt: The user's input prompt
        model: The model to use (defaults to gemini-1.5-flash)
        
    Returns:
        str: The generated response or error message
        
    Raises:
        HTTPException: For rate limiting and other API errors
    """
    global last_call_time
    
    # Rate limiting
    current_time = time.time()
    time_since_last_call = current_time - last_call_time
    if time_since_last_call < RATE_LIMIT_DELAY:
        wait_time = RATE_LIMIT_DELAY - time_since_last_call
        await asyncio.sleep(wait_time)
    
    # If not using Gemini or API key not configured, use fallback
    if settings.llm_provider.lower() != "gemini" or not settings.gemini_api_key or genai is None:
        print("WARNING: Using fallback LLM response - Gemini not properly configured")
        return _get_fallback_response()
    
    # Configure Gemini
    genai.configure(api_key=settings.gemini_api_key)
    model_name = model or "gemini-1.5-flash"
    
    try:
        # Make the API call
        last_call_time = time.time()
        model = genai.GenerativeModel(model_name)
        response = await asyncio.to_thread(
            model.generate_content,
            f"System: {system_prompt}\n\n{user_prompt}"
        )
        
        if hasattr(response, 'text'):
            return response.text
        elif hasattr(response, 'candidates') and response.candidates:
            return response.candidates[0].content.parts[0].text
        else:
            return str(response)
            
    except Exception as e:
        error_info = _parse_gemini_error(e)
        print(f"ERROR: {error_info['error_type']} - {error_info['message']}: {error_info['details']}")
        
        if error_info["error_type"] == "rate_limit":
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": "API rate limit exceeded. Please wait before making more requests.",
                    "retry_after": RATE_LIMIT_DELAY
                }
            )
        else:
            # For other errors, return a fallback response instead of failing
            print("Falling back to default response due to API error")
            return _get_fallback_response()

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
            "Configure GEMINI_API_KEY in .env file for real analysis",
            "Set LLM_PROVIDER=gemini in your environment variables",
            "Ensure you have sufficient API quota for Gemini"
        ]
    }
    return json.dumps(fallback_response, indent=2)