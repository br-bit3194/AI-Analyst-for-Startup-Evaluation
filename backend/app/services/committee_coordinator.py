from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
import asyncio
import json
from datetime import datetime
from fastapi import UploadFile
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
        input_data: Dict[str, Any], 
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Coordinate the analysis of a pitch across all agents with progress updates.
        
        Args:
            input_data: Dictionary containing:
                - pitch: The startup pitch to analyze (required)
                - file: Optional UploadFile object for PDF processing
            progress_callback: Optional callback function that receives (message, progress)
            
        Returns:
            Dict containing analysis results from all agents and final verdict
        """
        async def update_progress(message: str, progress: int):
            if progress_callback:
                await progress_callback(message, progress)
                
        await update_progress("Initializing analysis...", 0)
        
        # If input_data is a string (for backward compatibility), convert to dict
        if isinstance(input_data, str):
            input_data = {'pitch': input_data}
        
        # Extract pitch and file from input_data
        pitch = input_data.get('pitch', '')
        file = input_data.get('file')
        
        # If file is provided, add it to the context
        if file:
            input_data['file'] = file
        
        # Run the analysis
        result = await self.analyze_pitch(pitch, file=file)
        
        await update_progress("Analysis complete!", 100)
        return result
        
    async def analyze_pitch(self, pitch: str, file: Optional[UploadFile] = None) -> Dict[str, Any]:
        """
        Coordinate the analysis of a pitch across all agents.
        
        Args:
            pitch: The startup pitch to analyze
            file: Optional UploadFile object for PDF processing
            
        Returns:
            Dict containing analysis results from all agents and final verdict
        """
        analysis_start = datetime.utcnow()
        
        # Prepare input data with metadata
        input_data = {
            'pitch': pitch,
            'timestamp': analysis_start.isoformat(),
            'analysis_id': str(hash(pitch + str(analysis_start.timestamp()))),
            'file': file  # Include the file in the input data
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
            Dict containing the final verdict, confidence, and committee analysis
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
        
        # Calculate weighted confidence and collect votes
        total_weight = 0
        weighted_confidence = 0
        votes = []
        
        for agent_name, result in agent_results.items():
            try:
                # Skip if result is not a dictionary or indicates failure
                if not isinstance(result, dict) or not result.get('success', False):
                    continue
                
                # Get confidence, defaulting to 0.5 if not a number
                try:
                    confidence = float(result.get('data', {}).get('confidence', 0.5))
                except (TypeError, ValueError):
                    confidence = 0.5
                
                # Ensure confidence is between 0 and 1
                confidence = max(0.0, min(1.0, confidence))
                
                # Get weight for this agent
                weight = agent_weights.get(agent_name, 0.1)
                
                # Calculate vote based on confidence
                if confidence >= 0.7:
                    vote = 'STRONG_INVEST' if confidence >= 0.8 else 'INVEST'
                elif confidence >= 0.4:
                    vote = 'CONSIDER'
                else:
                    vote = 'RISKY'
                
                # Store vote and update weighted confidence
                votes.append((agent_name, vote, confidence))
                weighted_confidence += confidence * weight
                total_weight += weight
                
            except Exception as e:
                print(f"Error processing {agent_name}: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # Calculate average confidence and determine majority vote
        avg_confidence = (weighted_confidence / total_weight) if total_weight > 0 else 0
        
        # Count votes
        from collections import Counter
        vote_counts = Counter(vote for _, vote, _ in votes)
        majority_vote = vote_counts.most_common(1)[0][0] if vote_counts else 'CONSIDER'
        
        # Generate key debate points and dissenting opinions
        key_debate_points = []
        dissenting_opinions = []
        
        for agent_name, result in agent_results.items():
            if not isinstance(result, dict) or not result.get('success', False):
                continue
                
            data = result.get('data', {})
            
            # Add key insights as debate points
            if 'key_insights' in data and isinstance(data['key_insights'], list):
                key_debate_points.extend([
                    f"{agent_name}: {insight}" 
                    for insight in data['key_insights'][:2]  # Limit to top 2 insights per agent
                ])
            
            # Add dissenting opinions and extract reasoning
            agent_vote = next((vote for name, vote, _ in votes if name == agent_name), None)
            
            # Try to extract reasoning from different possible paths in the response
            reasoning = (
                data.get('reasoning') or 
                data.get('analysis') or 
                data.get('summary') or 
                'No detailed reasoning provided by the agent.'
            )
            
            if agent_vote and agent_vote != majority_vote:
                dissenting_opinions.append(
                    f"{agent_name} voted {agent_vote} because: {reasoning}"
                )
        
        # Generate final recommendation
        if avg_confidence >= 0.7:
            recommendation = 'INVEST' if avg_confidence < 0.8 else 'STRONG_INVEST'
            confidence_label = 'High'
        elif avg_confidence >= 0.4:
            recommendation = 'CONSIDER'
            confidence_label = 'Medium'
        else:
            recommendation = 'PASS'
            confidence_label = 'Low'
        
        # Prepare committee members data
        committee_members = []
        for agent_name, result in agent_results.items():
            if not isinstance(result, dict) or not result.get('success', False):
                continue
                
            data = result.get('data', {})
            agent_vote = next((vote for name, vote, _ in votes if name == agent_name), majority_vote)
            agent_confidence = next((conf for name, _, conf in votes if name == agent_name), avg_confidence)
            
            # Extract analysis text from different possible paths
            analysis_text = (
                data.get('analysis') or 
                data.get('summary') or 
                data.get('overview') or 
                'Comprehensive analysis not available.'
            )
            
            # If analysis is a dictionary, convert it to a readable string
            if isinstance(analysis_text, dict):
                analysis_text = '\n'.join(
                    f"{k}: {v}" if not isinstance(v, (list, dict)) 
                    else f"{k}: {', '.join(str(i) for i in v) if isinstance(v, list) else 'See details'}" 
                    for k, v in analysis_text.items()
                )
            
            committee_members.append({
                'name': agent_name,
                'role': f"Senior {agent_name.replace('_', ' ').title()}",
                'personality': data.get('personality', 'Analytical and data-driven'),
                'analysis': analysis_text,
                'vote': agent_vote,
                'confidence': agent_confidence * 100,  # Convert to percentage for display
                'reasoning': reasoning  # Using the reasoning extracted earlier
            })
        
        # Generate exit strategy for positive recommendations
        exit_strategy = None
        if recommendation in ['INVEST', 'STRONG_INVEST']:
            exit_strategy = self._generate_exit_strategy(agent_results, recommendation)
        
        # Prepare base response
        response = {
            'recommendation': recommendation,
            'confidence': avg_confidence,
            'confidence_label': confidence_label,
            'reasons': self._generate_verdict_reasons(agent_results, avg_confidence),
            'timestamp': datetime.utcnow().isoformat(),
            'committee_analysis': {
                'members': committee_members,
                'final_verdict': recommendation,
                'consensus_score': avg_confidence,
                'majority_vote': majority_vote,
                'dissenting_opinions': dissenting_opinions[:3],  # Limit to top 3
                'key_debate_points': key_debate_points[:5]  # Limit to top 5
            }
        }
        
        # Add exit strategy if available
        if exit_strategy:
            response['exit_strategy'] = exit_strategy
            
        return response
    
    def _generate_exit_strategy(self, agent_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate exit strategy recommendations for positive investment cases."""
        # Extract financial data from agent results
        financial_data = {}
        if 'FinanceExpert' in agent_results and agent_results['FinanceExpert'].get('success', False):
            financial_data = agent_results['FinanceExpert'].get('data', {})
            
        # Extract market data
        market_data = {}
        if 'MarketExpert' in agent_results and agent_results['MarketExpert'].get('success', False):
            market_data = agent_results['MarketExpert'].get('data', {})
            
        # Generate exit strategy using LLM
        system_prompt = """You are an investment strategist. Based on the company's financials and market position, 
        suggest potential exit strategies for investors. Consider:
        1. Potential acquisition targets and estimated timeline
        2. IPO potential and estimated timeline
        3. Secondary market opportunities
        4. Dividend potential
        
        Format your response as JSON with the following structure:
        {
            "exit_strategies": [
                {
                    "type": "acquisition" | "ipo" | "secondary" | "dividend",
                    "description": string,
                    "estimated_timeline_years": number,
                    "potential_returns_multiple": number,
                    "confidence": number (0-1),
                    "key_risks": string[]
                }
            ],
            "recommended_strategy": {
                "type": string,
                "reasoning": string,
                "investment_structure": {
                    "equity_percentage": string | null,
                    "convertible_note_terms": string | null,
                    "royalty_terms": string | null,
                    "preferred_terms": string | null
                }
            }
        }"""
        
        # Prepare context for the LLM
        context = {
            "financial_metrics": {
                "revenue": financial_data.get('revenue_analysis', {}).get('revenue', 'Not specified'),
                "growth_rate": financial_data.get('revenue_analysis', {}).get('growth_rate', 'Not specified'),
                "profit_margin": financial_data.get('financial_health', {}).get('profit_margin', 'Not specified'),
                "burn_rate": financial_data.get('financial_health', {}).get('burn_rate', 'Not specified')
            },
            "market_position": {
                "market_size": market_data.get('market_analysis', {}).get('market_size', 'Not specified'),
                "growth_potential": market_data.get('market_analysis', {}).get('growth_potential', 'Not specified'),
                "competitive_landscape": market_data.get('competitive_analysis', {}).get('landscape', 'Not specified')
            },
            "company_stage": "early" if 'early' in str(financial_data).lower() or 'startup' in str(financial_data).lower() else "growth"
        }
        
        # In a real implementation, you would call your LLM here
        # For now, we'll return a placeholder response
        return {
            "exit_strategies": [
                {
                    "type": "acquisition",
                    "description": "Potential acquisition by larger industry players looking to expand in this market segment.",
                    "estimated_timeline_years": 3,
                    "potential_returns_multiple": 5.0,
                    "confidence": 0.7,
                    "key_risks": ["Market consolidation", "Regulatory challenges"]
                },
                {
                    "type": "ipo",
                    "description": "Potential IPO if growth targets are met and market conditions remain favorable.",
                    "estimated_timeline_years": 5,
                    "potential_returns_multiple": 8.0,
                    "confidence": 0.5,
                    "key_risks": ["Market volatility", "Regulatory requirements"]
                }
            ],
            "recommended_strategy": {
                "type": "acquisition",
                "reasoning": "The company's strong market position and growth potential make it an attractive acquisition target.",
                "investment_structure": {
                    "equity_percentage": "15-20%",
                    "convertible_note_terms": "20% discount, $5M cap",
                    "royalty_terms": "5% of revenue until 2x return",
                    "preferred_terms": "1x liquidation preference, participating"
                }
            }
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
