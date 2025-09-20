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
            
            Format response as JSON."""
            
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
                    market_analysis = json.loads(response)
                elif isinstance(response, dict):
                    market_analysis = response
                else:
                    raise ValueError(f"Unexpected response type: {type(response)}")
                
                # Ensure the response has the expected structure
                if not isinstance(market_analysis, dict):
                    market_analysis = {
                        "market_size_validation": {"status": "unknown", "notes": "Unexpected response format"},
                        "growth_projections": [],
                        "competitive_positioning": {},
                        "market_entry_barriers": [],
                        "confidence": 0.5
                    }
                
                return self._format_response(
                    {"market_analysis": market_analysis},
                    confidence=float(market_analysis.get("confidence", 0.85))
                )
                
            except Exception as e:
                # If parsing fails, wrap the response in a structured format
                error_msg = f"Failed to process market analysis: {str(e)}"
                print(f"Error in MarketExpert: {error_msg}")
                return self._format_response(
                    {
                        "market_analysis": {
                            "error": error_msg,
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
                error=f"Market analysis failed: {str(e)}",
                confidence=0.0
            )
