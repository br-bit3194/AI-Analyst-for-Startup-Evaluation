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
                    # Clean the response string first
                    response = response.strip()
                    if response.startswith('```json'):
                        response = response[7:].strip().rstrip('`')
                    
                    # First try to parse the entire response as JSON
                    try:
                        parsed_response = json.loads(response)
                        # Check for both 'financial_analysis' and direct structure
                        if 'financial_analysis' in parsed_response:
                            financial_analysis = parsed_response['financial_analysis']
                            confidence = parsed_response.get('confidence', 0.8)
                        elif all(key in parsed_response for key in ['revenue_analysis', 'unit_economics', 'financial_health', 'projections']):
                            financial_analysis = parsed_response
                            confidence = parsed_response.get('confidence', 0.8)
                        else:
                            # If structure doesn't match, use the entire response
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
                                # Try both possible structures
                                if 'financial_analysis' in parsed_response:
                                    financial_analysis = parsed_response['financial_analysis']
                                elif all(key in parsed_response for key in ['revenue_analysis', 'unit_economics', 'financial_health', 'projections']):
                                    financial_analysis = parsed_response
                                else:
                                    financial_analysis = parsed_response
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
                    if 'financial_analysis' in response:
                        financial_analysis = response['financial_analysis']
                    elif all(key in response for key in ['revenue_analysis', 'unit_economics', 'financial_health', 'projections']):
                        financial_analysis = response
                    else:
                        financial_analysis = response
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
                
                # Ensure we have all required sections with proper defaults
                default_section = {
                    "analysis": "Not available",
                    "strengths": [],
                    "concerns": []
                }
                
                # Ensure all required sections exist
                financial_analysis = {
                    "revenue_analysis": financial_analysis.get('revenue_analysis', default_section.copy()),
                    "unit_economics": financial_analysis.get('unit_economics', default_section.copy()),
                    "financial_health": financial_analysis.get('financial_health', default_section.copy()),
                    "projections": financial_analysis.get('projections', default_section.copy()),
                    "confidence": confidence
                }
                
                return self._format_response(
                    financial_analysis,
                    confidence=confidence
                )
                
            except Exception as e:
                # If parsing fails, wrap the response in a structured format
                error_msg = f"Failed to process financial analysis: {str(e)}"
                print(f"Error in FinanceExpert: {error_msg}")
                # Return a structured error response with all required sections
                error_response = {
                    "revenue_analysis": {
                        "analysis": f"Error: {error_msg}",
                        "strengths": [],
                        "concerns": ["Failed to analyze"]
                    },
                    "unit_economics": {
                        "analysis": "Analysis unavailable due to error",
                        "cac": None,
                        "ltv": None,
                        "payback_period": None
                    },
                    "financial_health": {
                        "analysis": "Analysis unavailable due to error",
                        "burn_rate": None,
                        "runway_months": None
                    },
                    "projections": {
                        "analysis": "Analysis unavailable due to error",
                        "assumptions": [],
                        "risks": []
                    },
                    "error": error_msg,
                    "raw_response": str(response)[:500]
                }
                
                return self._format_response(
                    error_response,
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
