"""
Committee Coordinator for managing ADK-based agent analysis.
"""
from typing import Dict, Any, List, Optional, Union
from concurrent.futures import ThreadPoolExecutor
import asyncio
import json
from datetime import datetime
from .agents import (
    ADKAgent, AgentResponse, ADKAgentManager,
    create_financial_analyst, create_market_analyst,
    create_technical_analyst
)

class CommitteeCoordinator:
    """Coordinates the committee of ADK agents to analyze startup pitches."""
    
    def __init__(self, project_id: Optional[str] = None, location: str = "us-central1"):
        """Initialize the committee with ADK-based agents.
        
        Args:
            project_id: Google Cloud project ID
            location: Google Cloud location/region
        """
        # Initialize ADK agent manager
        self.manager = ADKAgentManager(project_id=project_id, location=location)
        
        # Create specialized agents
        self.agents: List[ADKAgent] = [
            create_financial_analyst(project_id=project_id, location=location),
            create_market_analyst(project_id=project_id, location=location),
            create_technical_analyst(project_id=project_id, location=location)
        ]
        
        # Add agents to manager
        for agent in self.agents:
            self.manager.add_agent(agent)
            
        self.executor = ThreadPoolExecutor(max_workers=len(self.agents) + 2)
    
    async def analyze_pitch(self, pitch: str) -> Dict[str, Any]:
        """
        Coordinate the analysis of a pitch across all agents.
        
        Args:
            pitch: The startup pitch to analyze
            
        Returns:
            Dict containing analysis results from all agents and final verdict
        """
        analysis_start = datetime.utcnow()
        analysis_id = str(hash(pitch + str(analysis_start.timestamp())))
        
        # Prepare input data with metadata
        context = {
            'pitch': pitch,
            'timestamp': analysis_start.isoformat(),
            'analysis_id': analysis_id
        }
        
        print("\n=== Starting agent analysis ===")
        print(f"Number of agents: {len(self.agents)}")
        
        # Run all agents in parallel
        tasks = []
        for agent in self.agents:
            print(f"Creating task for agent: {agent.name}")
            task = asyncio.create_task(
                self.manager.process_message(
                    agent_name=agent.name,
                    message="Please analyze this startup pitch and provide your assessment.",
                    context=context
                )
            )
            tasks.append((agent.name, task))
        
        # Process results
        analysis_results = {}
        for agent_name, task in tasks:
            try:
                print(f"\nWaiting for {agent_name}...")
                result = await task
                print(f"Got result from {agent_name}")
                
                # Process the ADK agent response
                if not isinstance(result, AgentResponse):
                    result = AgentResponse(
                        success=False,
                        content=str(result),
                        error="Unexpected response format"
                    )
                
                # Convert to dict for consistency
                agent_result = {
                    'success': result.success,
                    'content': result.content,
                    'error': result.error,
                    'metadata': result.metadata,
                    'confidence': result.metadata.get('confidence', 0.0) if result.metadata else 0.0
                }
                
                analysis_results[agent_name] = agent_result
                
            except Exception as e:
                error_msg = f"Agent {agent_name} failed: {str(e)}"
                print(f"Error in {agent_name}: {error_msg}")
                import traceback
                traceback.print_exc()
                analysis_results[agent_name] = {
                    'success': False,
                    'error': error_msg,
                    'content': '',
                    'metadata': {},
                    'confidence': 0.0
                }
        
        # Generate final recommendation
        final_verdict = await self._generate_verdict(analysis_results)
        
        # Calculate analysis duration
        analysis_duration = (datetime.utcnow() - analysis_start).total_seconds()
        
        return {
            'analysis_id': analysis_id,
            'start_time': analysis_start.isoformat(),
            'duration_seconds': analysis_duration,
            'agents': analysis_results,
            'final_verdict': final_verdict,
            'status': 'completed',
            'summary': self._generate_summary(analysis_results, final_verdict)
        }
    
    async def _generate_verdict(self, agent_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a final verdict based on all agent analyses.
        
        Args:
            agent_results: Dictionary of agent analysis results
            
        Returns:
            Dict containing the final verdict and confidence
        """
        # Calculate average confidence
        confidences = [
            result.get('confidence', 0.0)
            for result in agent_results.values()
            if result.get('success', False)
        ]
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        # Count successful analyses
        successful_analyses = sum(
            1 for result in agent_results.values()
            if result.get('success', False)
        )
        
        # Simple majority voting for verdict
        if successful_analyses == 0:
            return {
                'verdict': 'INCONCLUSIVE',
                'confidence': 0.0,
                'reason': 'No agents were able to analyze the pitch'
            }
            
        # Determine overall sentiment (simplified)
        positive_count = sum(
            1 for result in agent_results.values()
            if result.get('success') and result.get('metadata', {}).get('sentiment') == 'positive'
        )
        
        if positive_count >= successful_analyses * 0.7:  # 70% positive
            verdict = 'STRONG_INVEST'
        elif positive_count >= successful_analyses * 0.5:  # 50% positive
            verdict = 'INVEST'
        else:
            verdict = 'CONSIDER'
            
        # Generate reasons for the verdict
        reasons = []
        for agent_name, result in agent_results.items():
            if result.get('success'):
                metadata = result.get('metadata', {})
                if 'key_insights' in metadata:
                    reasons.append(f"{agent_name}: {metadata['key_insights']}")
                elif 'content' in result:
                    # Fallback to first sentence of content
                    first_sentence = result['content'].split('. ')[0]
                    reasons.append(f"{agent_name}: {first_sentence}.")
        
        return {
            'verdict': verdict,
            'confidence': avg_confidence,
            'successful_analyses': successful_analyses,
            'total_analyses': len(agent_results),
            'reasons': reasons[:3]  # Return top 3 reasons
        }
    
    def _generate_summary(self, agent_results: Dict[str, Any], verdict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of the analysis."""
        # Count successful vs failed analyses
        successful = sum(1 for r in agent_results.values() if r.get('success', False))
        failed = len(agent_results) - successful
        
        # Extract key points from each successful analysis
        key_points = []
        for agent_name, result in agent_results.items():
            if result.get('success'):
                # Try to extract key points from metadata or content
                metadata = result.get('metadata', {})
                if 'key_points' in metadata:
                    key_points.extend([
                        f"{agent_name}: {point}"
                        for point in metadata['key_points']
                    ])
                elif 'content' in result:
                    # Fallback: Use first few sentences as key points
                    sentences = result['content'].split('. ')[:2]
                    key_points.append(f"{agent_name}: {'. '.join(sentences)}.")
        
        # Limit to top 5 key points
        key_points = key_points[:5]
        
        # Generate summary text
        summary_parts = [
            f"Analysis completed with {successful} successful and {failed} failed agent analyses.",
            f"Final verdict: {verdict.get('verdict', 'UNKNOWN')} (confidence: {verdict.get('confidence', 0.0):.1%})"
        ]
        
        if key_points:
            summary_parts.append("\nKey points:")
            summary_parts.extend([f"- {point}" for point in key_points])
        
        # Add verdict reasons if available
        if 'reasons' in verdict and verdict['reasons']:
            summary_parts.append("\nKey reasons:")
            summary_parts.extend([f"- {reason}" for reason in verdict['reasons']])
        
        return {
            'text': '\n'.join(summary_parts),
            'successful_agents': successful,
            'failed_agents': failed,
            'confidence': verdict.get('confidence', 0.0),
            'verdict': verdict.get('verdict', 'UNKNOWN')
        }
