from typing import Dict, Any, List
from ..llm_client import call_llm
from .base_agent import BaseAgent, AgentResponse

class TeamEvaluator(BaseAgent):
    """Agent responsible for evaluating the founding team."""
    
    def __init__(self):
        super().__init__(name="TeamEvaluator", role="Evaluate founding team composition and experience")
    
    async def analyze(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Analyze the founding team."""
        try:
            pitch = input_data.get('pitch', '')
            
            system_prompt = """You are a Team Analyst evaluating a startup's founding team. Analyze:
            1. Team composition and experience
            2. Skill gaps
            3. Past successes/failures
            4. Leadership qualities
            5. Ability to execute
            
            Format response as JSON with the following structure:
            {
                "team_analysis": {
                    "team_composition": {
                        "strengths": string[],
                        "gaps": string[],
                        "completeness_score": number
                    },
                    "experience_assessment": {
                        "relevant_experience": string[],
                        "past_performance": string[],
                        "domain_expertise": string
                    },
                    "execution_risk": {
                        "key_risks": string[],
                        "mitigation_strategies": string[],
                        "risk_score": number
                    },
                    "recommendations": {
                        "key_hires_needed": string[],
                        "advisors_suggested": string[]
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
                        parsed_response = json.loads(response)
                        # If the response has a team_analysis field, use that
                        if 'team_analysis' in parsed_response:
                            team_analysis = parsed_response['team_analysis']
                            confidence = parsed_response.get('confidence', 0.8)
                        else:
                            team_analysis = parsed_response
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
                                team_analysis = parsed_response.get('team_analysis', parsed_response)
                                confidence = parsed_response.get('confidence', 0.8)
                            else:
                                raise ValueError("No valid JSON found in response")
                        except Exception as e:
                            # If all else fails, return the raw response with an error
                            team_analysis = {
                                "error": f"Failed to parse team analysis: {str(e)}",
                                "raw_response": response
                            }
                            confidence = 0.1
                elif isinstance(response, dict):
                    # If response is already a dict, use it directly
                    team_analysis = response.get('team_analysis', response)
                    confidence = response.get('confidence', 0.8)
                else:
                    raise ValueError(f"Unexpected response type: {type(response)}")
                
                # Ensure team_analysis is a dictionary
                if not isinstance(team_analysis, dict):
                    team_analysis = {
                        "team_composition": {
                            "strengths": [],
                            "gaps": ["Insufficient information to analyze team"],
                            "completeness_score": 5  # Default score on a scale of 1-10
                        },
                        "error": f"Unexpected team_analysis type: {type(team_analysis).__name__}",
                        "raw_response": response
                    }
                
                # Ensure confidence is a float
                try:
                    confidence = float(confidence)
                except (TypeError, ValueError):
                    confidence = 0.5
                
                return self._format_response(
                    {"team_analysis": team_analysis},
                    confidence=confidence
                )
                
            except Exception as e:
                # If parsing fails, wrap the response in a structured format
                error_msg = f"Failed to process team analysis: {str(e)}"
                print(f"Error in TeamEvaluator: {error_msg}")
                return self._format_response(
                    {
                        "team_analysis": {
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
                error=f"Team analysis failed: {str(e)}",
                confidence=0.0
            )
