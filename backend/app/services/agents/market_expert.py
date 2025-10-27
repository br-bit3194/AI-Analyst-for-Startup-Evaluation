from typing import Dict, Any
from ..llm_client import call_llm
from .base_agent import BaseAgent, AgentResponse

class MarketExpert(BaseAgent):
    """Agent responsible for market analysis and validation."""
    
    def __init__(self):
        super().__init__(name="MarketExpert", role="Analyze market potential and validate claims")
    
    async def analyze(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Analyze the market aspects of the pitch."""
        try:
            pitch = input_data.get('pitch', '')
            
            system_prompt = """You are a Market Expert evaluating a startup's market potential. Analyze:
            1. TAM/SAM/SOM claims
            2. Market trends
            3. Growth potential
            4. Competitive landscape
            5. Go-to-market strategy
            
            Provide analysis with:
            - Market size validation
            - Growth projections
            - Competitive positioning
            - Market entry barriers
            
            Format response as JSON with the following structure:
            {
                "market_size_validation": {
                    "tam": {
                        "value": "string | number | null",
                        "currency": "string | null",
                        "year": "number | null",
                        "source": "string | null",
                        "confidence": "number 0-1",
                        "notes": "string"
                    },
                    "sam": {
                        "value": "string | number | null",
                        "currency": "string | null",
                        "year": "number | null",
                        "source": "string | null",
                        "confidence": "number 0-1",
                        "notes": "string"
                    },
                    "som": {
                        "value": "string | number | null",
                        "currency": "string | null",
                        "year": "number | null",
                        "source": "string | null",
                        "confidence": "number 0-1",
                        "notes": "string"
                    },
                    "validation_notes": "string",
                    "confidence": "number 0-1"
                },
                "growth_projections": [
                    {
                        "year": "number",
                        "growth_rate": "number | null",
                        "market_size": "string | number | null",
                        "currency": "string | null",
                        "drivers": "string[]",
                        "confidence": "number 0-1"
                    }
                ],
                "competitive_positioning": {
                    "key_competitors": [
                        {
                            "name": "string",
                            "market_share": "string | number | null",
                            "strengths": "string[]",
                            "weaknesses": "string[]"
                        }
                    ],
                    "competitive_advantage": "string",
                    "market_position": "string",
                    "confidence": "number 0-1"
                },
                "market_entry_barriers": [
                    {
                        "barrier": "string",
                        "severity": "high | medium | low",
                        "mitigation": "string | null"
                    }
                ],
                "go_to_market_strategy": {
                    "channels": "string[]",
                    "customer_segments": "string[]",
                    "value_proposition": "string",
                    "confidence": "number 0-1"
                },
                "confidence": "number 0-1",
                "summary": "string"
            }"""
            
            response = await call_llm(
                system_prompt=system_prompt,
                user_prompt=pitch,
                model="gemini-2.5-pro"
            )
            
            # Process the response
            try:
                import json
                
                def get_default_market_analysis(error_msg=None):
                    default = {
                        "market_size_validation": {
                            "tam": {"value": None, "currency": None, "year": None, "source": None, "confidence": 0.5, "notes": error_msg or "No data available"},
                            "sam": {"value": None, "currency": None, "year": None, "source": None, "confidence": 0.5, "notes": ""},
                            "som": {"value": None, "currency": None, "year": None, "source": None, "confidence": 0.5, "notes": ""},
                            "validation_notes": error_msg or "Analysis not available",
                            "confidence": 0.1
                        },
                        "growth_projections": [],
                        "competitive_positioning": {
                            "key_competitors": [],
                            "competitive_advantage": "",
                            "market_position": "",
                            "confidence": 0.5
                        },
                        "market_entry_barriers": [],
                        "go_to_market_strategy": {
                            "channels": [],
                            "customer_segments": [],
                            "value_proposition": "",
                            "confidence": 0.5
                        },
                        "confidence": 0.1,
                        "summary": error_msg or "Market analysis not available"
                    }
                    if error_msg:
                        default["error"] = error_msg
                    return default
                
                # Parse the response
                market_analysis = None
                raw_response = response
                
                if isinstance(response, str):
                    # Clean the response string first
                    response = response.strip()
                    if response.startswith('```json'):
                        response = response[7:].strip().rstrip('`')
                    
                    try:
                        market_analysis = json.loads(response)
                    except json.JSONDecodeError:
                        # Try to extract JSON from the response
                        try:
                            start = response.find('{')
                            end = response.rfind('}') + 1
                            if start >= 0 and end > start:
                                json_str = response[start:end]
                                market_analysis = json.loads(json_str)
                            else:
                                raise ValueError("No valid JSON found in response")
                        except Exception as e:
                            print(f"Failed to parse market analysis: {str(e)}")
                            market_analysis = get_default_market_analysis(f"Failed to parse response: {str(e)}")
                elif isinstance(response, dict):
                    market_analysis = response
                else:
                    raise ValueError(f"Unexpected response type: {type(response)}")
                
                # Ensure we have a valid market_analysis dict
                if not isinstance(market_analysis, dict):
                    market_analysis = get_default_market_analysis("Invalid response format")
                
                # Ensure required fields exist
                default_analysis = get_default_market_analysis()
                for key in default_analysis.keys():
                    if key not in market_analysis:
                        market_analysis[key] = default_analysis[key]
                
                # Ensure confidence is a float
                try:
                    market_analysis["confidence"] = float(market_analysis.get("confidence", 0.5))
                except (TypeError, ValueError):
                    market_analysis["confidence"] = 0.5
                
                return self._format_response(
                    {"market_analysis": market_analysis},
                    confidence=market_analysis["confidence"]
                )
                
            except Exception as e:
                # If parsing fails, return a structured error response
                error_msg = f"Failed to process market analysis: {str(e)}"
                print(f"Error in MarketExpert: {error_msg}")
                
                # Create a detailed error response with all required fields
                error_analysis = get_default_market_analysis(error_msg)
                error_analysis["error"] = error_msg
                
                return self._format_response(
                    {"market_analysis": error_analysis},
                    success=False,
                    error=error_msg,
                    confidence=0.0
                )
            
        except Exception as e:
            return self._format_response(
                {},
                success=False,
                error=f"Market analysis failed: {str(e)}",
                confidence=0.0
            )
