from typing import Dict, Any, List
from ..llm_client import call_llm
from .base_agent import BaseAgent, AgentResponse

class CompetitiveAnalyst(BaseAgent):
    """Agent responsible for competitive landscape analysis."""
    
    def __init__(self):
        super().__init__(name="CompetitiveAnalyst", role="Analyze competitive landscape")
    
    async def analyze(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Analyze the competitive landscape."""
        try:
            pitch = input_data.get('pitch', '')
            
            system_prompt = """You are a Competitive Analyst evaluating a startup's position in the market. Analyze:
            1. Direct and indirect competitors
            2. Competitive advantages and disadvantages
            3. Market positioning
            4. Barriers to entry
            5. Potential threats from incumbents or new entrants
            
            Format response as JSON with the following structure:
            {
                "competitive_landscape": {
                    "direct_competitors": [
                        {
                            "name": string,
                            "strengths": string[],
                            "weaknesses": string[],
                            "differentiation": string
                        }
                    ],
                    "market_position": {
                        "positioning": string,
                        "unique_value_prop": string,
                        "moat": string
                    },
                    "barriers_to_entry": {
                        "existing": string[],
                        "potential": string[]
                    },
                    "threat_analysis": {
                        "incumbent_threats": string[],
                        "new_entrant_risks": string[],
                        "substitute_products": string[]
                    }
                },
                "confidence": number
            }"""
            
            response = await call_llm(
                system_prompt=system_prompt,
                user_prompt=pitch,
                model="gemini-2.5-pro"
            )
            
            # Process the response
            try:
                # Try to parse the response as JSON
                import json
                if isinstance(response, str):
                    # First try to parse the entire response as JSON
                    try:
                        # Clean the response string first
                        response = response.strip()
                        if response.startswith('```json'):
                            response = response[7:].strip().rstrip('`')
                        
                        parsed_response = json.loads(response)
                        
                        # Check for both 'competitive_landscape' and 'competitive_analysis' for backward compatibility
                        if 'competitive_landscape' in parsed_response:
                            competitive_analysis = parsed_response['competitive_landscape']
                            confidence = parsed_response.get('confidence', 0.8)
                        elif 'competitive_analysis' in parsed_response:
                            competitive_analysis = parsed_response['competitive_analysis']
                            confidence = parsed_response.get('confidence', 0.8)
                        else:
                            # If neither key exists, use the entire response as the analysis
                            competitive_analysis = parsed_response
                            confidence = parsed_response.get('confidence', 0.8)
                    except json.JSONDecodeError:
                        # If parsing fails, try to fix common JSON issues
                        try:
                            # Try to find JSON object in the response
                            start = response.find('{')
                            end = response.rfind('}') + 1
                            if start >= 0 and end > start:
                                json_str = response[start:end]
                                parsed_response = json.loads(json_str)
                                # Try both possible keys
                                competitive_analysis = parsed_response.get(
                                    'competitive_landscape',
                                    parsed_response.get('competitive_analysis', parsed_response)
                                )
                                confidence = parsed_response.get('confidence', 0.8)
                            else:
                                raise ValueError("No valid JSON found in response")
                        except Exception as e:
                            # If all else fails, return the raw response with an error
                            competitive_analysis = {
                                "error": f"Failed to parse competitive analysis: {str(e)}",
                                "raw_response": response
                            }
                            confidence = 0.1
                elif isinstance(response, dict):
                    # If response is already a dict, use it directly
                    competitive_analysis = response.get(
                        'competitive_landscape',
                        response.get('competitive_analysis', response)
                    )
                    confidence = response.get('confidence', 0.8)
                else:
                    raise ValueError(f"Unexpected response type: {type(response)}")
                
                # Ensure competitive_analysis is a dictionary
                if not isinstance(competitive_analysis, dict):
                    competitive_analysis = {
                        "error": f"Unexpected competitive_analysis type: {type(competitive_analysis).__name__}",
                        "raw_response": response
                    }
                
                # Ensure confidence is a float
                try:
                    confidence = float(confidence)
                except (TypeError, ValueError):
                    confidence = 0.5
                
                # Ensure we have the required structure
                if not isinstance(competitive_analysis, dict):
                    competitive_analysis = {
                        "error": "Invalid response format from LLM",
                        "raw_response": str(competitive_analysis)[:500]
                    }
                    confidence = 0.1
                
                return self._format_response(
                    {
                        "competitive_landscape": competitive_analysis,
                        "confidence": confidence
                    },
                    confidence=confidence
                )
                
            except Exception as e:
                # If parsing fails, wrap the response in a structured format
                error_msg = f"Failed to process competitive analysis: {str(e)}"
                print(f"Error in CompetitiveAnalyst: {error_msg}")
                return self._format_response(
                    {
                        "competitive_landscape": {
                            "error": error_msg,
                            "raw_response": str(response)[:500],  # Include first 500 chars of response for debugging
                            "direct_competitors": [],
                            "market_position": {
                                "positioning": "N/A",
                                "unique_value_prop": "N/A",
                                "moat": "N/A"
                            },
                            "barriers_to_entry": {
                                "existing": [],
                                "potential": []
                            },
                            "threat_analysis": {
                                "incumbent_threats": [],
                                "new_entrant_risks": [],
                                "substitute_products": []
                            }
                        }
                    },
                    success=False,
                    error=error_msg,
                    confidence=0.0
                )
            
        except Exception as e:
            return self._format_response(
                {},
                success=False,
                error=f"Competitive analysis failed: {str(e)}",
                confidence=0.0
            )
