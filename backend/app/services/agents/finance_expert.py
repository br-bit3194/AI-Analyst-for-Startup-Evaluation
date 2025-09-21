from typing import Dict, Any
from ..llm_client import call_llm
from .base_agent import BaseAgent, AgentResponse

class FinanceExpert(BaseAgent):
    """Agent responsible for financial analysis and projections."""
    
    def __init__(self):
        super().__init__(name="FinanceExpert", role="Analyze financial health and projections")
    
    async def analyze(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Analyze the financial aspects of the pitch."""
        try:
            pitch = input_data.get('pitch', '')
            
            system_prompt = """You are a Financial Expert evaluating a startup's financial health and projections. Analyze:
            1. Revenue model and pricing strategy
            2. Cost structure and unit economics
            3. Burn rate and runway
            4. Financial projections and assumptions
            5. Key metrics (CAC, LTV, MRR, etc.)
            
            For each aspect, provide:
            - Analysis of current state
            - Reasonableness of projections
            - Risk factors
            - Comparison to industry benchmarks
            
            Format response as JSON with the following structure:
            {
                "revenue_analysis": {
                    "model": string,
                    "strengths": string[],
                    "concerns": string[]
                },
                "unit_economics": {
                    "cac": number | null,
                    "ltv": number | null,
                    "payback_period": number | null,
                    "analysis": string
                },
                "financial_health": {
                    "burn_rate": number | null,
                    "runway_months": number | null,
                    "analysis": string
                },
                "projections": {
                    "assumptions_analysis": string,
                    "sensitivity_analysis": string,
                    "red_flags": string[]
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
                        parsed_response = json.loads(response)
                        # If the response has a financial_analysis field, use that
                        if 'financial_analysis' in parsed_response:
                            financial_analysis = parsed_response['financial_analysis']
                            confidence = parsed_response.get('confidence', 0.8)
                        else:
                            financial_analysis = parsed_response
                            confidence = 0.8
                    except json.JSONDecodeError:
                        # If parsing fails, try to fix common JSON issues
                        try:
                            # Try to find JSON object in the response
                            start = response.find('{')
                            end = response.rfind('}') + 1
                            if start >= 0 and end > start:
                                json_str = response[start:end]
                                parsed_response = json.loads(json_str)
                                financial_analysis = parsed_response.get('financial_analysis', parsed_response)
                                confidence = parsed_response.get('confidence', 0.8)
                            else:
                                raise ValueError("No valid JSON found in response")
                        except Exception as e:
                            # If all else fails, return the raw response with an error
                            financial_analysis = {
                                "error": f"Failed to parse financial analysis: {str(e)}",
                                "raw_response": response
                            }
                            confidence = 0.1
                elif isinstance(response, dict):
                    # If response is already a dict, use it directly
                    financial_analysis = response.get('financial_analysis', response)
                    confidence = response.get('confidence', 0.8)
                else:
                    raise ValueError(f"Unexpected response type: {type(response)}")
                
                # Ensure financial_analysis is a dictionary
                if not isinstance(financial_analysis, dict):
                    financial_analysis = {
                        "error": f"Unexpected financial_analysis type: {type(financial_analysis).__name__}",
                        "raw_response": response
                    }
                
                # Ensure confidence is a float
                try:
                    confidence = float(confidence)
                except (TypeError, ValueError):
                    confidence = 0.5
                
                return self._format_response(
                    {"financial_analysis": financial_analysis},
                    confidence=confidence
                )
                
            except Exception as e:
                # If parsing fails, wrap the response in a structured format
                error_msg = f"Failed to process financial analysis: {str(e)}"
                print(f"Error in FinanceExpert: {error_msg}")
                return self._format_response(
                    {
                        "financial_analysis": {
                            "error": error_msg,
                            "raw_response": str(response)[:500]  # Include first 500 chars of response for debugging
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
                error=f"Financial analysis failed: {str(e)}",
                confidence=0.0
            )
