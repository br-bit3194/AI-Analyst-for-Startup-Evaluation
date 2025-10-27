import json
import logging
from typing import Dict, Any, List, Optional, Union
from ..config import settings

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the appropriate service based on configuration
provider = (getattr(settings, 'llm_provider', '') or 'vertexai').lower()
try:
    from .vertex_ai_service import VertexAIService as LLMProvider
    logger.info("Using Vertex AI as the LLM provider")
except ImportError as e:
    logger.error(f"Failed to import Vertex AI service: {e}")
    raise ImportError(
        "Failed to initialize Vertex AI. Make sure you have installed the required dependencies: "
        "`pip install google-cloud-aiplatform vertexai`"
    )


class LLMService:
    """Service for interacting with LLM providers (Vertex AI or Gemini API)."""
    
    def __init__(self):
        """Initialize the LLM service with the configured provider."""
        self.provider = LLMProvider()
        
        # Set temperature based on the provider
        self.temperature = getattr(settings, 'vertex_temperature', 0.7)
        # Verify Vertex AI configuration
        if not all([getattr(settings, 'vertex_project', None), getattr(settings, 'vertex_location', None)]):
            logger.warning(
                "Vertex AI is not properly configured. "
                "Please set VERTEX_PROJECT and VERTEX_LOCATION in your environment variables."
            )
    def _clean_json_string(self, json_str: str) -> str:
        """Clean and repair a JSON string with common formatting issues."""
        if not json_str or not isinstance(json_str, str):
            return json_str
            
        try:
            # First try to parse directly - if it works, return as is
            json.loads(json_str)
            return json_str
        except json.JSONDecodeError:
            pass  # Continue with cleaning
            
        # Remove markdown code blocks
        if "```" in json_str:
            parts = json_str.split("```")
            # Take the part that looks most like JSON (has {})
            parts = [p for p in parts if p.strip() and '{' in p and '}' in p]
            if parts:
                json_str = max(parts, key=lambda x: x.count('{') + x.count('}'))
        
        # Find the first { and last } to get the JSON object
        start_idx = json_str.find('{')
        end_idx = json_str.rfind('}')
        
        if start_idx == -1 or end_idx == -1 or start_idx >= end_idx:
            # If we can't find a complete JSON object, try to find an array
            start_idx = json_str.find('[')
            end_idx = json_str.rfind(']')
            if start_idx == -1 or end_idx == -1 or start_idx >= end_idx:
                return '{}'  # Return empty object as fallback
                
        json_str = json_str[start_idx:end_idx + 1]
        
        # Fix common JSON issues
        result = []
        in_string = False
        escape = False
        last_char = None
        
        for i, char in enumerate(json_str):
            if char == '"' and (i == 0 or json_str[i-1] != '\\'):
                in_string = not in_string
                result.append(char)
            elif in_string:
                if char == '\n':
                    # Replace newlines in strings with \n
                    result.append('\\n')
                elif char == '\t':
                    result.append('\\t')
                elif char == '\r':
                    result.append('\\r')
                elif char == '\\' and i < len(json_str) - 1 and json_str[i+1] in '"\\/bfnrtu':
                    # Preserve valid escape sequences
                    result.append(char)
                elif char < ' ':
                    # Skip control characters
                    continue
                else:
                    result.append(char)
            else:
                # Outside strings, clean up whitespace
                if char in ' \t\r\n':
                    # Only add space if it's between tokens
                    if result and last_char not in ' \t\r\n{[:,' and char == ' ':
                        result.append(' ')
                else:
                    # Handle common JSON syntax issues
                    if char in ',]})' and last_char in ', \t\r\n':
                        # Remove trailing commas before closing brackets/braces
                        while result and result[-1] in ', \t\r\n':
                            result.pop()
                    result.append(char)
                    
            if char not in ' \t\r\n':
                last_char = char
        
        # Ensure we have balanced quotes and braces
        cleaned = ''.join(result)
        open_braces = cleaned.count('{')
        close_braces = cleaned.count('}')
        
        # If we have unbalanced braces, try to fix by adding missing ones
        if open_braces > close_braces:
            cleaned += '}' * (open_braces - close_braces)
        elif close_braces > open_braces:
            cleaned = ('{' * (close_braces - open_braces)) + cleaned
            
        return cleaned
    
    async def analyze_with_agent(self, agent_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the given context using a specific agent type.
        
        Args:
            agent_type: Type of agent (e.g., 'RiskAnalyst', 'MarketExpert')
            context: Context data for analysis
            
        Returns:
            Dict containing analysis results
        """
        if not hasattr(self.provider, 'analyze_with_agent'):
            logger.warning(f"Provider {type(self.provider).__name__} does not support agent analysis")
            return {
                'analysis': f"Agent analysis not supported by {type(self.provider).__name__}",
                'confidence': 0.1,
                'key_findings': [],
                'recommendations': [f"Switch to a provider that supports agent analysis"]
            }
            
        return await self.provider.analyze_with_agent(agent_type, context)
        
    async def generate_text(
        self, 
        prompt: str, 
        response_format: str = "text",
        **kwargs
    ) -> Union[str, Dict]:
        """
        Generate text using the configured LLM provider.
        
        Args:
            prompt: The input prompt
            response_format: The expected response format ("text" or "json")
            **kwargs: Additional arguments to pass to the provider
            
        Returns:
            The generated text or parsed JSON object
        """
        try:
            response = await self.provider.generate_text(prompt, **kwargs)
            
            if response_format == "json":
                try:
                    # Try to parse as JSON if the provider didn't already
                    if isinstance(response, str):
                        return json.loads(response)
                    return response
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response: {str(e)}")
                    # Try to fix common JSON issues
                    try:
                        # Try to extract JSON from markdown code blocks
                        json_match = re.search(r'```(?:json)?\n(.*?)\n```', response, re.DOTALL)
                        if json_match:
                            return json.loads(json_match.group(1))
                            
                        # Try to fix common JSON issues
                        fixed = self._fix_json(response)
                        return json.loads(fixed)
                    except Exception as e2:
                        logger.error(f"Failed to fix JSON response: {str(e2)}")
                        raise ValueError(f"Invalid JSON response from LLM: {response[:200]}...")
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}")
            raise
    
    async def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment of the given text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with sentiment scores (positive, negative, neutral)
        """
        prompt = f"""Analyze the sentiment of the following text and provide scores for positive, 
        negative, and neutral sentiment on a scale of 0 to 1, where 1 is the strongest.
        
        Text: {text}
        
        Return a JSON object with the following structure:
        {{
            "positive": float,
            "negative": float,
            "neutral": float
        }}"""
        
        return await self.generate_text(prompt, response_format="json")
    
    async def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """Extract keywords from the given text.
        
        Args:
            text: Text to extract keywords from
            top_n: Number of keywords to return
            
        Returns:
            List of extracted keywords
        """
        prompt = f"""Extract the top {top_n} most important keywords or key phrases from the following text.
        Focus on terms that represent the main topics, entities, and concepts.
        
        Text: {text}
        
        Return a JSON array of strings."""
        
        return await self.generate_text(prompt, response_format="json")
    
    async def summarize_text(self, text: str, max_length: int = 200) -> str:
        """Generate a concise summary of the given text.
        
        Args:
            text: Text to summarize
            max_length: Maximum length of the summary in characters
            
        Returns:
            Generated summary
        """
        prompt = f"""Please provide a concise summary of the following text in {max_length} characters or less.
        Focus on the main points and key information.
        
        Text: {text}"""
        
        return await self.generate_text(prompt, temperature=0.3)
