from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
import asyncio
import json
from datetime import datetime
from .agents import (
    BaseAgent, AgentResponse,
    RiskAnalyst, MarketExpert,
    FinanceExpert, CompetitiveAnalyst,
    TeamEvaluator
)

class CommitteeCoordinator:
    """Coordinates the committee of agents to analyze startup pitches."""
    
    def __init__(self):
        # Initialize all agents
        self.agents: List[BaseAgent] = [
            RiskAnalyst(),
            MarketExpert(),
            FinanceExpert(),
            CompetitiveAnalyst(),
            TeamEvaluator()
        ]
        self.executor = ThreadPoolExecutor(max_workers=len(self.agents) + 2)  # +2 for overhead
    
    async def analyze_pitch_with_progress(
        self, 
        pitch: str, 
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Coordinate the analysis of a pitch across all agents with progress updates.
        
        Args:
            pitch: The startup pitch to analyze
            progress_callback: Optional callback function that receives (message, progress)
            
        Returns:
            Dict containing analysis results from all agents and final verdict
        """
        async def update_progress(message: str, progress: int):
            if progress_callback:
                await progress_callback(message, progress)
                
        await update_progress("Initializing analysis...", 0)
        
        # Wrap the original analyze_pitch to maintain backward compatibility
        result = await self.analyze_pitch(pitch)
        
        await update_progress("Analysis complete!", 100)
        return result
        
    async def analyze_pitch(self, pitch: str) -> Dict[str, Any]:
        """
        Coordinate the analysis of a pitch across all agents.
        
        Args:
            pitch: The startup pitch to analyze
            
        Returns:
            Dict containing analysis results from all agents and final verdict
        """
        analysis_start = datetime.utcnow()
        
        # Prepare input data with metadata
        input_data = {
            'pitch': pitch,
            'timestamp': analysis_start.isoformat(),
            'analysis_id': str(hash(pitch + str(analysis_start.timestamp())))
        }
        
        # Set context for all agents
        for agent in self.agents:
            await agent.set_context(input_data)
        
        # Run all agents in parallel with progress tracking
        analysis_results = {}
        tasks = []
        
        # Progress tracking
        total_agents = len(self.agents)
        completed_agents = 0
        
        print("\n=== Starting agent analysis ===")
        print(f"Number of agents: {len(self.agents)}")
        
        # Create tasks for all agents
        for agent in self.agents:
            print(f"Creating task for agent: {agent.name}")
            task = asyncio.create_task(
                self._run_agent_analysis(agent, input_data)
            )
            tasks.append((agent.name, task))
        
        print("\n=== Waiting for agent results ===")
        # Wait for all tasks to complete
        for agent_name, task in tasks:
            try:
                print(f"\nWaiting for {agent_name}...")
                result = await task
                print(f"Got result from {agent_name}: {result}")
                
                # Ensure the result is a dictionary
                if not isinstance(result, dict):
                    print(f"Warning: {agent_name} returned non-dict result: {result}")
                    result = {
                        'success': False,
                        'error': f'Invalid result type: {type(result).__name__}',
                        'data': {},
                        'confidence': 0.0
                    }
                else:
                    # Ensure required fields exist with defaults
                    result.setdefault('success', True)
                    result.setdefault('data', {})
                    result.setdefault('confidence', 0.0)
                    result.setdefault('error', None)
                
                analysis_results[agent_name] = result
                completed_agents += 1
                
                # Update progress
                progress = int((completed_agents / total_agents) * 100)
                await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: asyncio.create_task(
                        update_progress(f"{agent_name} analysis complete", progress)
                    ) if hasattr(self, 'update_progress') else None
                )
                
            except Exception as e:
                error_msg = f"Agent {agent_name} failed: {str(e)}"
                print(f"Error in {agent_name}: {error_msg}")
                import traceback
                traceback.print_exc()
                analysis_results[agent_name] = {
                    'success': False,
                    'error': error_msg,
                    'data': {}
                }
                completed_agents += 1
                
                # Update progress even on error
                progress = int((completed_agents / total_agents) * 100)
                await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: asyncio.create_task(
                        update_progress(f"{agent_name} failed: {error_msg}", progress)
                    ) if hasattr(self, 'update_progress') else None
                )
        
        # Generate final recommendation
        final_verdict = await self._generate_verdict(analysis_results)
        
        # Calculate analysis duration
        analysis_duration = (datetime.utcnow() - analysis_start).total_seconds()
        
        return {
            'analysis_id': input_data['analysis_id'],
            'start_time': analysis_start.isoformat(),
            'duration_seconds': analysis_duration,
            'agents': analysis_results,
            'final_verdict': final_verdict,
            'status': 'completed',
            'summary': self._generate_summary(analysis_results, final_verdict)
        }
    
    async def _run_agent_analysis(self, agent: BaseAgent, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run analysis for a single agent with error handling."""
        try:
            print(f"\n=== Running agent: {agent.name} ===")
            print(f"Input data: {input_data}")
            
            # Call the agent's analyze method
            result = await agent.analyze(input_data)
            
            # Debug: Check the result type and content
            print(f"Agent {agent.name} result type: {type(result)}")
            print(f"Agent {agent.name} result content: {result}")
            
            # Convert AgentResponse to dict if needed
            if hasattr(result, 'dict') and callable(getattr(result, 'dict')):
                agent_result = result.dict()
            elif isinstance(result, dict):
                agent_result = result
            else:
                error_msg = f'Unexpected result type from {agent.name}: {type(result).__name__}'
                print(error_msg)
                return {
                    'success': False,
                    'error': error_msg,
                    'data': {},
                    'confidence': 0.0
                }
            
            # Ensure required fields exist with defaults
            agent_result.setdefault('success', True)
            agent_result.setdefault('data', {})
            agent_result.setdefault('confidence', 0.0)
            agent_result.setdefault('error', None)
            
            print(f"Agent {agent.name} processed result: {agent_result}")
            return agent_result
            
        except Exception as e:
            error_msg = f"Agent {agent.name} failed: {str(e)}"
            print(f"Error in {agent.name}: {error_msg}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': error_msg,
                'data': {}
            }

    async def _generate_verdict(self, agent_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a final verdict based on all agent analyses.
        
        Args:
            agent_results: Dictionary of agent analysis results
            
        Returns:
            Dict containing the final verdict and confidence
        """
        # Debug: Log the structure of agent_results
        print("\n=== Agent Results ===")
        for agent_name, result in agent_results.items():
            print(f"\nAgent: {agent_name}")
            print(f"Type: {type(result)}")
            print(f"Content: {result}")
            if isinstance(result, dict):
                print("Keys:", result.keys())
        
        # Calculate weights for different agents
        agent_weights = {
            'RiskAnalyst': 0.25,
            'MarketExpert': 0.2,
            'FinanceExpert': 0.25,
            'CompetitiveAnalyst': 0.15,
            'TeamEvaluator': 0.15
        }
        
        # Calculate weighted confidence
        total_weight = 0
        weighted_confidence = 0
        
        for agent_name, result in agent_results.items():
            try:
                # Debug: Print agent result before processing
                print(f"\nProcessing {agent_name}:")
                print(f"Result type: {type(result)}")
                print(f"Result content: {result}")
                
                # Skip if result is not a dictionary
                if not isinstance(result, dict):
                    print(f"Warning: {agent_name} result is not a dictionary: {result}")
                    continue
                
                # Skip if result indicates failure
                if not result.get('success', False):
                    print(f"Warning: {agent_name} reported failure: {result.get('error', 'No error details')}")
                    continue
                
                # Get confidence, defaulting to 0 if not a number
                try:
                    confidence = float(result.get('confidence', 0))
                except (TypeError, ValueError):
                    print(f"Warning: {agent_name} has invalid confidence value: {result.get('confidence')}")
                    confidence = 0.0
                
                # Ensure confidence is between 0 and 1
                confidence = max(0.0, min(1.0, confidence))
                
                # Get weight for this agent
                weight = agent_weights.get(agent_name, 0.1)
                
                print(f"Agent {agent_name} - Confidence: {confidence}, Weight: {weight}")
                weighted_confidence += confidence * weight
                total_weight += weight
                
            except Exception as e:
                print(f"Error processing {agent_name}: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # Normalize confidence
        avg_confidence = (weighted_confidence / total_weight) if total_weight > 0 else 0
        
        # Generate recommendation based on confidence
        if avg_confidence >= 0.7:
            recommendation = "INVEST"
            confidence_label = "High"
        elif avg_confidence >= 0.4:
            recommendation = "CONSIDER"
            confidence_label = "Medium"
        else:
            recommendation = "PASS"
            confidence_label = "Low"
        
        # Generate reasons for the decision
        reasons = self._generate_verdict_reasons(agent_results, avg_confidence)
        
        return {
            'recommendation': recommendation,
            'confidence': avg_confidence,
            'confidence_label': confidence_label,
            'reasons': reasons,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _generate_verdict_reasons(self, agent_results: Dict[str, Any], confidence: float) -> List[str]:
        """Generate human-readable reasons for the verdict."""
        reasons = []
        
        # Add overall confidence reason
        confidence_pct = int(confidence * 100)
        reasons.append(f"Committee confidence: {confidence_pct}%")
        
        # Add agent-specific insights
        for agent_name, result in agent_results.items():
            if result.get('success', False):
                data = result.get('data', {})
                if agent_name == 'RiskAnalyst' and 'risk_analysis' in data:
                    risks = data['risk_analysis'].get('high_risk_factors', [])
                    if risks:
                        reasons.append(f"Key risks identified: {', '.join(risks[:2])}")
                
                elif agent_name == 'FinanceExpert' and 'financial_analysis' in data:
                    finance = data['financial_analysis']
                    if 'red_flags' in finance and finance['red_flags']:
                        reasons.append(f"Financial red flags: {finance['red_flags'][0]}")
        
        return reasons
    
    def _generate_summary(self, agent_results: Dict[str, Any], verdict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of the analysis."""
        summary = {
            'key_insights': [],
            'strengths': [],
            'concerns': [],
            'recommendations': []
        }
        
        # Process each agent's results
        for agent_name, result in agent_results.items():
            if not result.get('success', False):
                continue
                
            data = result.get('data', {})
            
            # Example: Extract key insights from each agent
            if agent_name == 'MarketExpert' and 'market_analysis' in data:
                market = data['market_analysis']
                if 'key_trends' in market:
                    summary['key_insights'].extend(market['key_trends'][:2])
                if 'growth_potential' in market:
                    summary['strengths'].append(market['growth_potential'])
            
            # Add similar processing for other agents
            
        return summary
