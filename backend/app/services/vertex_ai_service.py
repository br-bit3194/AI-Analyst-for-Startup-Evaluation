import asyncio
import json
import logging
import time
from typing import Any, Dict, List, Optional, Union

import vertexai
from fastapi import HTTPException
from vertexai.generative_models import GenerativeModel, GenerationConfig

from ..config import settings

# Configure logging
logger = logging.getLogger(__name__)

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

def _get_fallback_response() -> str:
    """Return a fallback response when Vertex AI is not available."""
    return """{
        "error": "Vertex AI service is not available",
        "message": "The AI service is currently unavailable. Please try again later.",
        "status": "SERVICE_UNAVAILABLE"
    }"""

class VertexAIService:
    """Service for interacting with Google Vertex AI's Gemini models."""
    
    def __init__(self):
        """Initialize the Vertex AI service with project and location."""
        self.initialized = False
        self.model = None
        self.model_name = settings.vertex_model_name or "gemini-2.5-pro"
        self.temperature = getattr(settings, 'vertex_temperature', 0.7)
        
        if not all([settings.vertex_project, settings.vertex_location]):
            logger.warning(
                "Vertex AI not properly configured. Please set VERTEX_PROJECT and VERTEX_LOCATION "
                "environment variables to enable Vertex AI integration."
            )
            return
            
        try:
            # Initialize Vertex AI
            vertexai.init(
                project=settings.vertex_project,
                location=settings.vertex_location
            )
            
            # Initialize model
            self.model = GenerativeModel(
                self.model_name,
                generation_config={
                    "temperature": self.temperature,
                    "max_output_tokens": 8192,
                    "top_p": 0.95,
                    "top_k": 40
                }
            )
            self.initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI: {str(e)}")
            self.initialized = False
    
    async def analyze_with_agent(self, agent_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the given context using a specific agent type.
        
        Args:
            agent_type: Type of agent (e.g., 'RiskAnalyst', 'MarketExpert')
            context: Context data for analysis
            
        Returns:
            Dict containing analysis results
        """
        if not self.initialized:
            return self._get_agent_fallback_response(agent_type)
            
        try:
            # Get the appropriate system prompt for the agent type
            system_prompt = self._get_agent_system_prompt(agent_type)
            
            # Format the user prompt with context
            user_prompt = self._format_agent_prompt(agent_type, context)
            
            # Call the LLM
            response = await self.call_llm(system_prompt, user_prompt)
            
            # Parse and validate the response
            return self._parse_agent_response(agent_type, response)
            
        except Exception as e:
            logger.error(f"Error in {agent_type} analysis: {str(e)}", exc_info=True)
            return self._get_agent_fallback_response(agent_type, str(e))
            
    def _get_agent_system_prompt(self, agent_type: str) -> str:
        """Get the system prompt for a specific agent type."""
        prompts = {
            'RiskAnalyst': """You are a Risk Analyst evaluating startup investment opportunities. 
                Analyze the provided startup information and provide a detailed risk assessment.""",
                
            'MarketExpert': """You are a Market Expert analyzing market opportunities. 
                Evaluate the market potential, competition, and growth prospects.""",
                
            'FinanceExpert': """You are a Financial Analyst. 
                Analyze the financial health and projections of the startup.""",
                
            'CompetitiveAnalyst': """You are a Competitive Intelligence Analyst. 
                Analyze the competitive landscape and positioning.""",
                
            'TeamEvaluator': """You are a Team Evaluation Specialist. 
                Assess the startup team's experience, skills, and track record."""
        }
        return prompts.get(agent_type, "You are an expert analyst. Please analyze the following information.")
        
    def _format_agent_prompt(self, agent_type: str, context: Dict[str, Any]) -> str:
        """Format the user prompt with the given context."""
        return f"""
        Please analyze the following startup information and provide a comprehensive {agent_type} report.
        
        STARTUP INFORMATION:
        {json.dumps(context, indent=2)}
        
        Provide your analysis in the following JSON format:
        {{
            "analysis": "Detailed analysis text",
            "confidence": 0.0-1.0,
            "key_findings": [],
            "recommendations": []
        }}
        """
        
    def _parse_agent_response(self, agent_type: str, response: str) -> Dict[str, Any]:
        """Parse and validate the agent's response."""
        try:
            result = json.loads(response)
            if not isinstance(result, dict):
                raise ValueError("Response is not a JSON object")
                
            # Ensure required fields are present
            result.setdefault('analysis', "")
            result.setdefault('confidence', 0.8)
            result.setdefault('key_findings', [])
            result.setdefault('recommendations', [])
            
            return result
            
        except json.JSONDecodeError:
            # If response is not valid JSON, return as analysis text
            return {
                'analysis': response,
                'confidence': 0.7,
                'key_findings': [],
                'recommendations': []
            }
            
    def _get_agent_fallback_response(self, agent_type: str, error: str = None) -> Dict[str, Any]:
        """Get a fallback response when agent analysis fails."""
        return {
            'analysis': f"{agent_type} analysis failed: {error or 'Service not available'}",
            'confidence': 0.1,
            'key_findings': [],
            'recommendations': [
                "Check your Vertex AI configuration and credentials",
                "Verify that the Vertex AI API is enabled in your Google Cloud project"
            ]
        }
    
    async def call_llm(self, system_prompt: str, user_prompt: str, model: str = None) -> str:
        """
        Unified LLM call with rate limiting and error handling.
        
        Args:
            system_prompt: The system prompt/instructions for the LLM
            user_prompt: The user's input prompt
            model: The model to use (defaults to settings.vertex_model_name or gemini-2.5-pro)
            
        Returns:
            str: The generated response or error message as a JSON string
        """
        global last_call_time
        
        # Rate limiting
        current_time = time.time()
        time_since_last_call = current_time - last_call_time
        if time_since_last_call < RATE_LIMIT_DELAY:
            wait_time = RATE_LIMIT_DELAY - time_since_last_call
            await asyncio.sleep(wait_time)
        
        # If not using Vertex AI or model not initialized, use fallback
        if not self.initialized or settings.llm_provider.lower() != "vertexai":
            logger.warning("Using fallback LLM response - Vertex AI not properly configured")
            return json.dumps({
                "error": "Vertex AI not properly configured",
                "success": False,
                "confidence": 0.0
            })
        
        try:
            # Update last call time
            last_call_time = time.time()
            
            # Combine system and user prompts
            full_prompt = f"""System: {system_prompt}
            
            {user_prompt}"""
            
            # Generate response
            response = await self.model.generate_content_async(
                full_prompt,
                generation_config={
                    "temperature": self.temperature,
                    "max_output_tokens": 8192,
                    "top_p": 0.95,
                    "top_k": 40
                }
            )
            
            # Extract text from response
            if response.candidates and response.candidates[0].content.parts:
                return response.candidates[0].content.parts[0].text
            else:
                return json.dumps({
                    "error": "No valid response generated from the model",
                    "success": False,
                    "confidence": 0.0
                })
                
        except Exception as e:
            error_info = _parse_vertexai_error(e)
            logger.error(f"Error in Vertex AI call: {error_info}")
            return json.dumps({
                "error": error_info["message"],
                "error_type": error_info["error_type"],
                "details": error_info.get("details", ""),
                "success": False,
                "confidence": 0.0
            })
            logger.error(f"{error_info['error_type']} - {error_info['message']}: {error_info['details']}")
            
            if error_info["error_type"] == "rate_limit":
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limit_exceeded",
                        "message": "API rate limit exceeded. Please wait before making more requests.",
                        "retry_after": RATE_LIMIT_DELAY
                    }
                )
            
            # For other errors, return a generic error message
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "vertex_ai_error",
                    "message": error_info["message"],
                    "details": error_info.get("details", "")
                }
            )
    
    # For backward compatibility
    async def generate_text(
        self,
        prompt: str,
        response_format: str = "text",
        temperature: Optional[float] = None,
        max_output_tokens: int = 2048,
        **kwargs
    ) -> Any:
        """Legacy method for backward compatibility."""
        return await self.call_llm(
            system_prompt="You are a helpful AI assistant.",
            user_prompt=prompt
        )
    
    def _clean_json_string(self, json_str: str) -> str:
        """Clean up common JSON formatting issues."""
        # Remove leading/trailing whitespace
        json_str = json_str.strip()
        
        # Remove markdown formatting
        if json_str.startswith('```json'):
            json_str = json_str[7:].rsplit('```', 1)[0].strip()
        elif json_str.startswith('```'):
            json_str = json_str[3:].rsplit('```', 1)[0].strip()
        
        # Remove trailing commas
        json_str = json_str.replace(',]', ']').replace(',}', '}')
        
        return json_str
    
    def _extract_json(self, text: str) -> Optional[str]:
        """Try to extract a valid JSON object/array from text."""
        try:
            # Look for the first { or [ and last } or ]
            start_brace = text.find('{')
            start_bracket = text.find('[')
            
            if start_brace == -1 and start_bracket == -1:
                return None
                
            start = min(
                start_brace if start_brace != -1 else float('inf'),
                start_bracket if start_bracket != -1 else float('inf')
            )
            
            if start == float('inf'):
                return None
                
            # Find matching closing brace/bracket
            stack = []
            for i in range(start, len(text)):
                char = text[i]
                if char in '{[':
                    stack.append(char)
                elif char in '}]':
                    if not stack:
                        break
                    if (char == '}' and stack[-1] == '{') or (char == ']' and stack[-1] == '['):
                        stack.pop()
                        if not stack:
                            return text[start:i+1]
        except Exception as e:
            logger.warning(f"Error extracting JSON: {str(e)}")
            
        return None
