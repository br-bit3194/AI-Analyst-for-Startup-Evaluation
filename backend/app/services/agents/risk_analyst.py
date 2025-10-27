from typing import Dict, Any
from ..llm_client import call_llm
from .base_agent import BaseAgent, AgentResponse

class RiskAnalyst(BaseAgent):
    """Agent responsible for risk assessment and analysis."""
    
    def __init__(self):
        super().__init__(name="RiskAnalyst", role="Identify and evaluate potential risks")
    
    async def analyze(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Analyze the input for potential risks."""
        try:
            # Extract relevant data from input
            pitch = input_data.get('pitch', '')
            
            # Prepare the prompt for risk analysis
            system_prompt = """You are a Risk Analyst evaluating a startup pitch. Your task is to identify and assess potential risks including:
            - Market risks
            - Competitive risks
            - Execution risks
            - Financial risks
            - Team risks
            - Technology risks
            - Regulatory risks
            
            Format your response as a JSON object with the following structure:
            {
                "risk_factors": [
                    {
                        "category": "string (e.g., 'Market', 'Financial', 'Team')",
                        "description": "string",
                        "impact": "High | Medium | Low",
                        "likelihood": "High | Medium | Low",
                        "confidence": "number between 0 and 1",
                        "mitigation": "string | null"
                    }
                ],
                "overall_risk": {
                    "level": "High | Medium | Low",
                    "explanation": "string",
                    "confidence": "number between 0 and 1"
                },
                "key_risks_summary": "string",
                "recommendations": ["string"],
                "confidence": "number between 0 and 1"
            }
            
            Ensure all fields are included and properly formatted as JSON. If a field is not applicable, use null."""
            
            # Call the LLM for analysis
            response = await call_llm(
                system_prompt=system_prompt,
                user_prompt=pitch,
                model="gemini-2.5-pro"
            )
            
            # Process the response
            try:
                import json
                
                def get_default_risk_analysis(error_msg=None):
                    default = {
                        "risk_factors": [],
                        "overall_risk": {
                            "level": "Unknown",
                            "explanation": error_msg or "Risk analysis not available",
                            "confidence": 0.1
                        },
                        "key_risks_summary": error_msg or "Risk analysis not available",
                        "recommendations": [
                            "Review the input data and try again",
                            "Check the model's response format"
                        ] if not error_msg else [f"Error: {error_msg}"],
                        "confidence": 0.1
                    }
                    if error_msg:
                        default["risk_factors"].append({
                            "category": "System",
                            "description": error_msg,
                            "impact": "High",
                            "likelihood": "High",
                            "confidence": 1.0,
                            "mitigation": "Review the error and try again"
                        })
                    return default
                
                # Parse the response
                risk_analysis = None
                
                if isinstance(response, str):
                    # Clean the response string first
                    response = response.strip()
                    if response.startswith('```json'):
                        response = response[7:].strip().rstrip('`')
                    
                    try:
                        risk_analysis = json.loads(response)
                    except json.JSONDecodeError:
                        # Try to extract JSON from the response
                        try:
                            start = response.find('{')
                            end = response.rfind('}') + 1
                            if start >= 0 and end > start:
                                json_str = response[start:end]
                                risk_analysis = json.loads(json_str)
                            else:
                                raise ValueError("No valid JSON found in response")
                        except Exception as e:
                            print(f"Failed to parse risk analysis: {str(e)}")
                            risk_analysis = get_default_risk_analysis(f"Failed to parse response: {str(e)}")
                elif isinstance(response, dict):
                    risk_analysis = response
                else:
                    raise ValueError(f"Unexpected response type: {type(response)}")
                
                # Ensure we have a valid risk_analysis dict
                if not isinstance(risk_analysis, dict):
                    risk_analysis = get_default_risk_analysis("Invalid response format")
                
                # Ensure required fields exist
                default_analysis = get_default_risk_analysis()
                for key in default_analysis.keys():
                    if key not in risk_analysis:
                        risk_analysis[key] = default_analysis[key]
                
                # Ensure confidence is a float
                try:
                    risk_analysis["confidence"] = float(risk_analysis.get("confidence", 0.5))
                    if risk_analysis["overall_risk"].get("confidence") is not None:
                        risk_analysis["overall_risk"]["confidence"] = float(risk_analysis["overall_risk"]["confidence"])
                except (TypeError, ValueError):
                    risk_analysis["confidence"] = 0.5
                
                # Ensure all risk factors have required fields
                if "risk_factors" in risk_analysis and isinstance(risk_analysis["risk_factors"], list):
                    for risk in risk_analysis["risk_factors"]:
                        if not isinstance(risk, dict):
                            continue
                        if "impact" not in risk:
                            risk["impact"] = "Medium"
                        if "likelihood" not in risk:
                            risk["likelihood"] = "Medium"
                        if "confidence" not in risk:
                            risk["confidence"] = 0.5
                
                return self._format_response(
                    {"risk_analysis": risk_analysis},
                    confidence=risk_analysis["confidence"]
                )
                
            except Exception as e:
                # If parsing fails, return a structured error response
                error_msg = f"Failed to process risk analysis: {str(e)}"
                print(f"Error in RiskAnalyst: {error_msg}")
                
                # Create a detailed error response with all required fields
                error_analysis = get_default_risk_analysis(error_msg)
                error_analysis["error"] = error_msg
                
                return self._format_response(
                    {"risk_analysis": error_analysis},
                    success=False,
                    error=error_msg,
                    confidence=0.0
                )
            
        except Exception as e:
            return self._format_response(
                {},
                success=False,
                error=f"Risk analysis failed: {str(e)}",
                confidence=0.0
            )
