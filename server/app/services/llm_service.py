import json
import logging
from typing import Dict, Any, List
import google.generativeai as genai
from ..config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with Gemini LLM."""
    
    def __init__(self):
        """Initialize the LLM service with configuration from environment variables."""
        self.model_name = settings.gemini_model_name
        self.temperature = float(getattr(settings, 'gemini_model_temperature', 0.7))
        self._initialize_gemini()
    
    def _initialize_gemini(self):
        """Initialize the Gemini client with API key from environment variables."""
        if not settings.gemini_api_key:
            raise ValueError("gemini_api_key not configured in settings")
            
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(self.model_name)
    
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
    
    async def generate_text(
        self, 
        prompt: str, 
        response_format: str = "text",
        temperature: float = None,
        max_tokens: int = 2048,
        **kwargs
    ) -> Any:
        """Generate text using the Gemini model.
        
        Args:
            prompt: The prompt to generate text from
            response_format: The format of the response ('text' or 'json')
            temperature: Controls randomness (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            **kwargs: Additional generation parameters
            
        Returns:
            Generated text or parsed JSON, depending on response_format
        """
        try:
            # Use instance temperature if not explicitly provided
            if temperature is None:
                temperature = self.temperature
                
            # Add format instruction if JSON is requested
            if response_format.lower() == "json":
                prompt = f"""{prompt}
                
IMPORTANT: Your response MUST be a valid JSON object with the following rules:
1. Use double quotes for all strings and property names
2. Escape all special characters in strings with a backslash (e.g., \" and \\)
3. Do NOT include any markdown formatting like ```json or ```
4. Ensure all strings are properly quoted
5. Remove any trailing commas in arrays and objects
6. Ensure all brackets and braces are properly matched

Example of valid JSON:
{{
    "key": "value",
    "nested": {{
        "array": [1, 2, 3],
        "escaped": "This is a \"quoted\" string"
    }}
}}
"""
            
            # Generate response
            response = await self.model.generate_content_async(
                prompt,
                generation_config={
                    "temperature": min(max(temperature, 0), 1),  # Ensure 0-1 range
                    "max_output_tokens": max(1, min(max_tokens, 8192)),  # Ensure reasonable limits
                    **{k: v for k, v in kwargs.items() if k not in ['temperature', 'max_output_tokens']}
                }
            )
            
            # Extract text from response
            result = response.text.strip()
            
            # Parse JSON if requested
            if response_format.lower() == "json":
                max_attempts = 3
                last_error = None
                
                for attempt in range(max_attempts):
                    try:
                        # Try direct JSON parse first
                        logger.info(f"result: {result}")
                        parsed = json.loads(result)
                        return parsed
                    except json.JSONDecodeError as e:
                        last_error = e
                        logger.warning(f"JSON parse attempt {attempt + 1} failed: {str(e)}")
                        
                        # Save the original result for the first attempt
                        if attempt == 0:
                            original_result = result
                        
                        # Clean and try again with more aggressive cleaning on subsequent attempts
                        result = self._clean_json_string(original_result if attempt > 0 else result)
                        
                        if attempt == max_attempts - 1:  # Last attempt
                            logger.error(f"JSON parse failed after {max_attempts} attempts")
                            logger.debug(f"Original response: {original_result}")
                            logger.debug(f"Cleaned response: {result}")
                            
                            # Try to extract a valid JSON substring as a last resort
                            try:
                                # Look for the largest valid JSON object/array
                                for i in range(len(result)):
                                    for j in range(len(result), i, -1):
                                        try:
                                            return json.loads(result[i:j])
                                        except json.JSONDecodeError:
                                            continue
                            except Exception:
                                pass
                            
                            # If we get here, all attempts failed
                            error_msg = (
                                "The model's response could not be parsed as valid JSON. "
                                f"Original error: {str(last_error)}\n"
                                "This might be due to malformed JSON or special characters in the response. "
                                "Try modifying your prompt to request simpler JSON output."
                            )
                            logger.error(error_msg)
                            raise ValueError(error_msg) from last_error
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}", exc_info=True)
            if response_format.lower() == "json":
                # Return a safe error response in the expected format
                return {
                    "error": "Failed to generate valid response",
                    "details": str(e)
                }
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
