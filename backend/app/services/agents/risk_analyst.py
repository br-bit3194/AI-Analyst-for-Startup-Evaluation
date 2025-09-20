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
            
            For each risk, provide:
            1. Risk category
            2. Description
            3. Potential impact (High/Medium/Low)
            4. Confidence level (0-1)
            5. Mitigation suggestions
            
            Format your response as JSON."""
            
            # Call the LLM for analysis
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
                    risk_analysis = json.loads(response)
                elif isinstance(response, dict):
                    risk_analysis = response
                else:
                    raise ValueError(f"Unexpected response type: {type(response)}")
                
                # Ensure the response has the expected structure
                if not isinstance(risk_analysis, dict):
                    risk_analysis = {
                        "high_risk_factors": [f"Unexpected response format: {type(risk_analysis).__name__}"],
                        "medium_risk_factors": [],
                        "low_risk_factors": [],
                        "confidence": 0.5
                    }
                
                return self._format_response(
                    {"risk_analysis": risk_analysis},
                    confidence=float(risk_analysis.get("confidence", 0.85))
                )
                
            except Exception as e:
                # If parsing fails, wrap the response in a structured format
                error_msg = f"Failed to process risk analysis: {str(e)}"
                print(f"Error in RiskAnalyst: {error_msg}")
                return self._format_response(
                    {
                        "risk_analysis": {
                            "high_risk_factors": [error_msg],
                            "medium_risk_factors": [],
                            "low_risk_factors": [],
                            "confidence": 0.0
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
                error=f"Risk analysis failed: {str(e)}",
                confidence=0.0
            )
