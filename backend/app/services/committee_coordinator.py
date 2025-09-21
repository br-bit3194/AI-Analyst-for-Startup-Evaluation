# Standard library imports
import asyncio
import json
import logging
import traceback
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

# Local application imports
from app.config import settings
from .agents import (
    ADKAgent,
    ADKAgentManager,
    AgentResponse,
    create_financial_analyst,
    create_market_analyst,
    create_technical_analyst,
    create_agent_manager,
    ANALYSIS_TOOLS
)
from .memory.investment_memory import InvestmentMemorySystem
from .risk.risk_radar import RiskRadarSystem
from .market.market_validator import MarketValidator
from .dashboard.financial_dashboard import FinancialDashboard

# Set up logging
logger = logging.getLogger(__name__)

class CommitteeCoordinator:
    """
    Coordinates a team of specialized AI agents to evaluate startup investment opportunities.
    
    Implements a multi-agent system that simulates a VC investment committee with:
    - Investment Committee Simulator with multiple AI personas
    - Investment Memory System for learning from past decisions
    - Explainable Risk Radar with confidence scoring
    - Conversational Due Diligence capabilities
    - Continuous Monitoring & Smart Alerts
    - Founder & Team Analysis
    - Market Validation
    - Competitive Landscape Analysis
    - Automated Deal Memo Generation
    - Financial Dashboard Integration
    """
    
    def __init__(self, project_id: Optional[str] = None, location: str = "us-central1"):
        """Initialize the committee with ADK-based agents and required configurations.
        
        Args:
            project_id: Google Cloud project ID
            location: Google Cloud location/region
        """
        # Create specialized agents with required configuration
        agent_config = {
            'project_id': project_id or settings.GOOGLE_CLOUD_PROJECT,
            'location': location or settings.GOOGLE_CLOUD_LOCATION
        }
        
        # Initialize systems
        self.memory_system = InvestmentMemorySystem()
        self.risk_radar = RiskRadarSystem()
        self.market_validator = MarketValidator()
        self.financial_dashboard = FinancialDashboard()
        
        # Create and register agents with specialized roles
        self.agents: Dict[str, ADKAgent] = {}
        
        # Create available agents
        self.agents['financial_analyst'] = create_financial_analyst(**agent_config)
        self.agents['market_analyst'] = create_market_analyst(**agent_config)
        self.agents['technical_analyst'] = create_technical_analyst(**agent_config)
        
        # Initialize agent manager with available agents
        self.manager = create_agent_manager(
            project_id=project_id or settings.GOOGLE_CLOUD_PROJECT,
            location=location or settings.GOOGLE_CLOUD_LOCATION
        )
        
        # Add agents to manager with configuration
        for name, agent in self.agents.items():
            self.manager.add_agent(agent, name=name)
        
        # Initialize thread pool for concurrent processing
        self.executor = ThreadPoolExecutor(max_workers=len(self.agents) + 4)  # Extra workers for parallel tasks
        
        logger.info(f"Initialized CommitteeCoordinator with {len(self.agents)} specialized agents")
    
    def _initialize_analysis_context(self, pitch: str, context: Optional[Dict[str, Any]], 
                                 analysis_id: str, analysis_start: datetime) -> Dict[str, Any]:
        """Initialize and enrich the analysis context with default values and metadata."""
        if context is None:
            context = {}
            
        # Basic metadata
        enriched_context = {
            'analysis_id': analysis_id,
            'timestamp': analysis_start.isoformat(),
            'pitch_length': len(pitch),
            'pitch': pitch,
            'analysis_status': 'initialized',
            'analysis_framework': {
                'version': '1.0',
                'components': [
                    'investment_committee',
                    'risk_radar',
                    'market_validation',
                    'financial_analysis',
                    'team_evaluation',
                    'competitive_analysis'
                ]
            }
        }
        
        # Merge with provided context (allowing overrides)
        enriched_context.update(context)
        return enriched_context
    
    async def _enrich_pitch_data(self, pitch: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance the pitch data with additional information from external sources."""
        enriched_data = {}
        
        try:
            # Extract key entities (company name, industry, etc.)
            entities = await self._extract_entities(pitch)
            enriched_data['entities'] = entities
            
            # Get market data if company/industry is identified
            if 'company_name' in entities or 'industry' in entities:
                market_data = await self.market_validator.get_market_data(
                    company_name=entities.get('company_name'),
                    industry=entities.get('industry'),
                    location=entities.get('location')
                )
                enriched_data['market_data'] = market_data
            
            # Check for existing company data in memory
            if 'company_name' in entities:
                historical_data = await self.memory_system.get_company_history(
                    entities['company_name']
                )
                if historical_data:
                    enriched_data['historical_analysis'] = historical_data
            
            logger.info(f"Successfully enriched pitch data with {len(enriched_data)} data points")
            
        except Exception as e:
            logger.error(f"Error enriching pitch data: {str(e)}", exc_info=True)
            # Continue with analysis even if enrichment fails
            
        return enriched_data
    
    async def _run_parallel_analysis(self, pitch: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute all agent analyses in parallel."""
        tasks = {}
        results = {}
        
        # Create tasks for all agents
        for agent_name, agent in self.agents.items():
            try:
                task = asyncio.create_task(
                    self.manager.process_message(
                        agent_name=agent_name,
                        message=pitch,
                        context=context
                    )
                )
                tasks[agent_name] = task
            except Exception as e:
                logger.error(f"Failed to create task for {agent_name}: {str(e)}")
                results[agent_name] = {
                    'success': False,
                    'error': str(e),
                    'content': None
                }
        
        # Wait for all tasks to complete
        completed, _ = await asyncio.wait(tasks.values(), return_when=asyncio.ALL_COMPLETED)
        
        # Process results
        for agent_name, task in tasks.items():
            try:
                response = await task
                results[agent_name] = {
                    'success': response.success,
                    'content': response.content,
                    'error': response.error,
                    'metadata': response.metadata or {}
                }
            except Exception as e:
                logger.error(f"Error in {agent_name} analysis: {str(e)}", exc_info=True)
                results[agent_name] = {
                    'success': False,
                    'error': str(e),
                    'content': None
                }
        
        return results
    
    async def _run_committee_deliberation(self, agent_results: Dict[str, Any], 
                                        context: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate committee deliberation and voting process using available agent outputs."""
        try:
            # Use all available agents as committee members
            votes = []
            for member, result in agent_results.items():
                try:
                    if result.get('success') and result.get('content'):
                        vote = await self._parse_vote(result['content'])
                        if vote:
                            votes.append({
                                'member': member,
                                'vote': vote['decision'],
                                'confidence': vote.get('confidence', 0.5),
                                'rationale': vote.get('rationale', '')
                            })
                except Exception as e:
                    logger.warning(f"Failed parsing vote for member {member}: {str(e)}")
                    continue

            # Calculate final decision (simple majority)
            vote_counts: Dict[str, int] = {}
            for v in votes:
                decision = v['vote']
                vote_counts[decision] = vote_counts.get(decision, 0) + 1

            # Final decision by majority or HOLD if no votes parsed
            final_decision = max(vote_counts.items(), key=lambda x: x[1])[0] if vote_counts else 'HOLD'

            return {
                'decision': final_decision,
                'votes': votes,
                'vote_summary': vote_counts,
                'timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in committee deliberation: {str(e)}", exc_info=True)
            return {
                'decision': 'HOLD',
                'error': str(e),
                'votes': [],
                'vote_summary': {},
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def _assess_opportunities(self, agent_results: Dict[str, Any], 
                                  context: Dict[str, Any]) -> Dict[str, Any]:
        """Identify and evaluate growth opportunities."""
        try:
            # Combine opportunity assessments from all agents
            opportunities = []
            for agent_name, result in agent_results.items():
                if result.get('success') and 'opportunities' in result.get('metadata', {}):
                    agent_opps = result['metadata']['opportunities']
                    if isinstance(agent_opps, list):
                        opportunities.extend(agent_opps)
            
            # Group and score opportunities
            scored_opportunities = {}
            for opp in opportunities:
                if not isinstance(opp, dict):
                    continue
                
                opp_key = opp.get('name') or opp.get('description', '')
                if not opp_key:
                    continue
                    
                if opp_key not in scored_opportunities:
                    scored_opportunities[opp_key] = {
                        'scores': [],
                        'sources': [],
                        'details': opp
                    }
                
                # Add score if available
                if 'score' in opp:
                    try:
                        score = float(opp['score'])
                        scored_opportunities[opp_key]['scores'].append(score)
                    except (ValueError, TypeError):
                        pass
                
                # Track which agents identified this opportunity
                if 'agent' in opp:
                    scored_opportunities[opp_key]['sources'].append(opp['agent'])
            
            # Calculate average scores
            final_opportunities = []
            for key, data in scored_opportunities.items():
                scores = data['scores']
                avg_score = sum(scores) / len(scores) if scores else 0.5
                
                final_opportunities.append({
                    'opportunity': key,
                    'score': avg_score,
                    'confidence': min(1.0, len(scores) * 0.2),  # More sources = higher confidence
                    'sources': list(set(data['sources'])),
                    'details': data['details']
                })
            
            # Sort by score (descending)
            final_opportunities.sort(key=lambda x: x['score'], reverse=True)
            
            return {
                'opportunities': final_opportunities,
                'total_opportunities': len(final_opportunities),
                'average_opportunity_score': (
                    sum(o['score'] for o in final_opportunities) / len(final_opportunities) 
                    if final_opportunities else 0
                )
            }
            
        except Exception as e:
            logger.error(f"Error assessing opportunities: {str(e)}", exc_info=True)
            return {
                'opportunities': [],
                'error': str(e),
                'total_opportunities': 0,
                'average_opportunity_score': 0
            }
    
    async def _generate_investment_report(self, pitch: str, context: Dict[str, Any],
                                        agent_results: Dict[str, Any],
                                        committee_verdict: Dict[str, Any],
                                        risk_assessment: Dict[str, Any],
                                        opportunity_assessment: Dict[str, Any],
                                        financial_analysis: Dict[str, Any],
                                        market_validation: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a comprehensive investment report."""
        try:
            # Generate executive summary
            executive_summary = await self._generate_executive_summary(
                pitch, committee_verdict, risk_assessment, opportunity_assessment
            )
            
            # Generate detailed sections
            sections = {
                'executive_summary': executive_summary,
                'investment_thesis': await self._generate_investment_thesis(agent_results),
                'risk_analysis': await self._format_risk_analysis(risk_assessment),
                'opportunity_analysis': await self._format_opportunity_analysis(opportunity_assessment),
                'financial_analysis': financial_analysis,
                'market_validation': market_validation,
                'team_analysis': agent_results.get('team_analyst', {}).get('content', {}),
                'competitive_landscape': agent_results.get('competition_analyst', {}).get('content', {}),
                'committee_recommendation': committee_verdict,
                'appendix': {
                    'analysis_metadata': {
                        'analysis_id': context.get('analysis_id'),
                        'timestamp': context.get('timestamp'),
                        'agents_used': list(agent_results.keys())
                    }
                }
            }
            
            # Generate different report formats
            return {
                'sections': sections,
                'formats': {
                    'json': json.dumps(sections, indent=2),
                    'markdown': self._convert_to_markdown(sections),
                    'html': self._convert_to_html(sections)
                },
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating investment report: {str(e)}", exc_info=True)
            return {
                'error': f"Failed to generate report: {str(e)}",
                'sections': {}
            }
    
    # Additional helper methods would be defined here...
    async def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract key entities from text using NLP."""
        # This would typically call an NLP service
        return {}
    
    async def _parse_vote(self, content: Any) -> Optional[Dict[str, Any]]:
        """Parse agent response into a structured vote."""
        try:
            if not content:
                return None
                
            if isinstance(content, str):
                # Simple parsing of string responses
                content = content.lower()
                decision = None
                if 'invest' in content:
                    decision = 'INVEST'
                elif 'pass' in content:
                    decision = 'PASS'
                elif 'hold' in content:
                    decision = 'HOLD'
                    
                if decision:
                    return {
                        'decision': decision,
                        'confidence': 0.7,  # Default confidence
                        'rationale': content
                    }
            
            # Handle structured responses
            if isinstance(content, dict):
                return {
                    'decision': content.get('decision', 'HOLD').upper(),
                    'confidence': float(content.get('confidence', 0.5)),
                    'rationale': content.get('rationale', '')
                }
                
            return None
            
        except Exception as e:
            logger.error(f"Error parsing vote: {str(e)}")
            return None
    
    def _convert_to_markdown(self, sections: Dict[str, Any]) -> str:
        """Convert report sections to Markdown format."""
        # Implementation would convert the sections to Markdown
        return "# Investment Report\n\n*Report generation in progress...*"
    
    def _convert_to_html(self, sections: Dict[str, Any]) -> str:
        """Convert report sections to HTML format."""
        # Implementation would convert the sections to HTML
        return "<h1>Investment Report</h1><p><em>Report generation in progress...</em></p>"
    
    async def _generate_executive_summary(self, pitch: str, committee_verdict: Dict[str, Any],
                                        risk_assessment: Dict[str, Any],
                                        opportunity_assessment: Dict[str, Any]) -> str:
        """Generate an executive summary of the investment opportunity."""
        # This would generate a concise summary
        return "Executive summary generation in progress..."
    
    async def _generate_investment_thesis(self, agent_results: Dict[str, Any]) -> str:
        """Generate the investment thesis based on agent analyses."""
        # This would synthesize the key points from all agents
        return "Investment thesis generation in progress..."
    
    async def _format_risk_analysis(self, risk_assessment: Dict[str, Any]) -> str:
        """Format the risk analysis section."""
        # This would format the risk analysis for the report
        return "Risk analysis formatting in progress..."
    
    async def _format_opportunity_analysis(self, opportunity_assessment: Dict[str, Any]) -> str:
        """Format the opportunity analysis section."""
        # This would format the opportunity analysis for the report
        return "Opportunity analysis formatting in progress..."
    
    async def analyze_pitch(self, pitch: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Coordinate the analysis of a startup pitch using the full investment committee simulation.
        
        Implements a multi-stage analysis process:
        1. Initial Data Collection & Enrichment
        2. Parallel Agent Analysis
        3. Committee Deliberation & Voting
        4. Risk & Opportunity Assessment
        5. Memory Integration & Learning
        6. Report Generation
        
        Args:
            pitch: The startup pitch to analyze (can include structured data)
            context: Additional context including market data, team info, financials, etc.
            
        Returns:
            Dict containing comprehensive analysis including:
            - Committee vote and recommendation
            - Risk assessment with explainable scoring
            - Financial health analysis
            - Team evaluation
            - Market validation
            - Competitive analysis
            - Investment memo
        """
        analysis_start = datetime.utcnow()
        analysis_id = f"analysis_{int(analysis_start.timestamp())}_{hash(pitch) & 0xFFFFFFFF}"
        
        try:
            # Initialize context with enhanced metadata and framework
            logger.info(f"Initializing context for analysis {analysis_id}")
            context = self._initialize_analysis_context(pitch, context or {}, analysis_id, analysis_start)
            
            # 1. Data Enrichment Phase
            logger.info(f"Starting data enrichment for analysis {analysis_id}")
            enriched_data = await self._enrich_pitch_data(pitch, context)
            context.update(enriched_data)
            
            # 2. Parallel Analysis Phase
            logger.info("Starting parallel agent analysis")
            agent_results = {}
            
            # Process with all agents in parallel
            tasks = []
            for agent_name, agent in self.agents.items():
                try:
                    logger.info(f"Starting analysis with {agent_name}...")
                    task = asyncio.create_task(
                        self.manager.process_message(
                            agent_name=agent_name,
                            message=pitch,
                            context=context
                        )
                    )
                    tasks.append((agent_name, task))
                except Exception as e:
                    logger.error(f"Failed to create task for {agent_name}: {str(e)}")
                    agent_results[agent_name] = {
                        'success': False,
                        'error': str(e),
                        'content': None
                    }
            
            # Wait for all tasks to complete
            for agent_name, task in tasks:
                try:
                    response = await task
                    logger.debug(f"Raw response from {agent_name}: {response}")
                    
                    # Process the response
                    if hasattr(response, 'dict'):  # It's a Pydantic model
                        response = response.dict()
                    
                    agent_results[agent_name] = {
                        'success': response.get('success', False),
                        'content': response.get('content', ''),
                        'error': response.get('error'),
                        'metadata': response.get('metadata', {})
                    }
                except Exception as e:
                    logger.error(f"Error processing {agent_name} response: {str(e)}", exc_info=True)
                    agent_results[agent_name] = {
                        'success': False,
                        'error': str(e),
                        'content': None
                    }
            
            # 3. Committee Deliberation
            logger.info("Starting committee deliberation")
            committee_verdict = await self._run_committee_deliberation(agent_results, context)
            
            # 4. Risk & Opportunity Assessment
            logger.info("Running risk and opportunity assessment")
            # RiskRadar expects a single analysis_data dict
            risk_assessment = await self.risk_radar.assess_risks({
                'agent_results': agent_results,
                'context': context
            })
            opportunity_assessment = await self._assess_opportunities(agent_results, context)
            
            # 5. Financial Analysis
            logger.info("Running financial analysis")
            financial_analysis = {}
            if hasattr(self, 'financial_dashboard') and self.financial_dashboard:
                try:
                    financial_data = context.get('financials', {})
                    if not isinstance(financial_data, dict):
                        financial_data = {}
                    financial_analysis = await self.financial_dashboard.generate_dashboard(financial_data)
                except Exception as e:
                    logger.error(f"Financial analysis failed: {str(e)}", exc_info=True)
                    financial_analysis = {}
            
            # 6. Market Validation
            logger.info("Validating market claims")
            market_validation = {}
            if hasattr(self, 'market_validator') and self.market_validator:
                try:
                    entities = context.get('entities', {}) or {}
                    market_data = await self.market_validator.get_market_data(
                        company_name=entities.get('company_name'),
                        industry=entities.get('industry'),
                        location=entities.get('location')
                    )
                    market_validation = await self.market_validator.validate_market_fit(
                        company_data={'entities': entities, 'pitch': pitch},
                        market_data=market_data
                    )
                except Exception as e:
                    logger.error(f"Market validation failed: {str(e)}", exc_info=True)
                    market_validation = {}

            # 6.5 Generate standardized final verdict and summary for API consumers
            logger.info("Generating final verdict and summary")
            final_verdict_structured = await self._generate_verdict(agent_results)
            conf = float(final_verdict_structured.get('confidence', 0.0) or 0.0)
            if conf >= 0.7:
                conf_label = 'HIGH'
            elif conf >= 0.4:
                conf_label = 'MEDIUM'
            else:
                conf_label = 'LOW'
            final_verdict = {
                'recommendation': final_verdict_structured.get('verdict', 'HOLD'),
                'confidence': conf,
                'confidence_label': conf_label,
                'reasons': final_verdict_structured.get('verdict_reasons', []),
                'timestamp': datetime.utcnow().isoformat()
            }

            # Build a concise summary compatible with API expectations
            try:
                strengths_list = []
                for opp in final_verdict_structured.get('opportunities', {}).get('key_opportunities', []):
                    try:
                        area = str(opp.get('area', 'Opportunity')).replace('_', ' ').title()
                        pot = float(opp.get('average_potential', 0.0))
                        strengths_list.append(f"{area} (Potential: {pot:.1f})")
                    except Exception:
                        continue

                concerns_list = []
                for risk in final_verdict_structured.get('risk_assessment', {}).get('high_risk_areas', []):
                    try:
                        concerns_list.append(str(risk.get('risk', 'risk')).replace('_', ' ').title())
                    except Exception:
                        continue

                key_insights = [
                    f"Committee decision: {str(committee_verdict.get('decision', 'HOLD'))}",
                    f"Overall risk score: {float(final_verdict_structured.get('risk_assessment', {}).get('overall_risk_score', 0.0)):.2f}",
                    f"Agent consensus: {float(final_verdict_structured.get('consensus', 0.0)):.0%} ({int(final_verdict_structured.get('successful_analyses', 0))}/{int(final_verdict_structured.get('total_analyses', 0))})"
                ]

                # Derive recommendations from the narrative next steps if available
                recommendations = []
                try:
                    generated_summary = self._generate_summary(agent_results, final_verdict_structured)
                    next_steps_block = generated_summary.get('next_steps', '')
                    for line in str(next_steps_block).splitlines():
                        line = line.strip()
                        if line.startswith('- '):
                            recommendations.append(line[2:])
                except Exception:
                    pass

                summary = {
                    'key_insights': key_insights,
                    'strengths': strengths_list,
                    'concerns': concerns_list,
                    'recommendations': recommendations
                }
            except Exception as e:
                logger.error(f"Error generating summary block: {str(e)}", exc_info=True)
                summary = {
                    'key_insights': [],
                    'strengths': [],
                    'concerns': [],
                    'recommendations': []
                }
            
            # 7. Update Memory System
            if hasattr(self, 'memory_system') and self.memory_system:
                logger.info("Updating investment memory")
                try:
                    await self.memory_system.store_analysis({
                        'analysis_id': analysis_id,
                        'pitch': pitch,
                        'context': context,
                        'results': {
                            'agent_results': agent_results,
                            'committee_verdict': committee_verdict,
                            'risk_assessment': risk_assessment,
                            'financial_analysis': financial_analysis,
                            'market_validation': market_validation,
                            'final_verdict': final_verdict,
                            'summary': summary
                        }
                    })
                except Exception as e:
                    logger.error(f"Error updating memory system: {str(e)}", exc_info=True)
            
            # 8. Generate Final Report
            logger.info("Generating final report")
            report = {}
            try:
                report = await self._generate_investment_report(
                    pitch=pitch,
                    context=context,
                    agent_results=agent_results,
                    committee_verdict=committee_verdict,
                    risk_assessment=risk_assessment,
                    opportunity_assessment=opportunity_assessment,
                    financial_analysis=financial_analysis,
                    market_validation=market_validation
                )
            except Exception as e:
                logger.error(f"Error generating report: {str(e)}", exc_info=True)
                report = {
                    'error': f"Failed to generate report: {str(e)}",
                    'traceback': traceback.format_exc()
                }
            
            # Calculate analysis duration
            analysis_duration = (datetime.utcnow() - analysis_start).total_seconds()
            
            # Return comprehensive results
            return {
                'analysis_id': analysis_id,
                'status': 'completed',
                'duration_seconds': analysis_duration,
                'start_time': analysis_start.isoformat(),
                'verdict': committee_verdict,
                'final_verdict': final_verdict,
                'risk_assessment': risk_assessment,
                'opportunity_assessment': opportunity_assessment,
                'financial_analysis': financial_analysis,
                'market_validation': market_validation,
                'agent_results': agent_results,
                'summary': summary,
                'report': report,
                'metadata': {
                    'agents_used': list(self.agents.keys()),
                    'analysis_framework_version': '1.0',
                    'model_versions': {
                        'llm': getattr(settings, 'LLM_MODEL', 'unknown'),
                        'risk_model': getattr(self.risk_radar, 'get_version', lambda: 'unknown')(),
                        'memory_model': getattr(self.memory_system, 'get_version', lambda: 'unknown')()
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Critical error in analyze_pitch: {str(e)}", exc_info=True)
            return {
                'analysis_id': analysis_id,
                'status': 'error',
                'error': str(e),
                'traceback': traceback.format_exc(),
                'start_time': analysis_start.isoformat(),
                'duration_seconds': (datetime.utcnow() - analysis_start).total_seconds()
            }
        
        # This method has been refactored - the remaining code is handled in the main try block
    
    async def _generate_verdict(self, agent_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a comprehensive investment recommendation based on all agent analyses.
        
        Args:
            agent_results: Dictionary of agent analysis results with metadata
            
        Returns:
            Dict containing:
            - Verdict (STRONG_INVEST/INVEST/CONSIDER/HOLD/PASS)
            - Confidence score (0-1)
            - Risk assessment
            - Growth opportunities
            - Key metrics
            - Committee consensus
        """
        # Initialize default values
        default_verdict = {
            'verdict': 'HOLD',
            'confidence': 0.0,
            'consensus': 0.0,
            'successful_analyses': 0,
            'total_analyses': len(agent_results),
            'risk_assessment': {
                'overall_risk_score': 0.5,
                'high_risk_areas': [],
                'risk_factors': {}
            },
            'opportunities': {
                'overall_opportunity_score': 0.5,
                'key_opportunities': [],
                'detailed_opportunities': {}
            },
            'key_metrics': {},
            'verdict_reasons': []
        }

        # If no successful results, return default
        successful_results = {k: v for k, v in agent_results.items() if v.get('success')}
        if not successful_results:
            logger.error("No successful agent results to generate verdict from")
            return default_verdict

        # Calculate average confidence and collect metadata
        confidences = []
        risk_factors = {}
        opportunities = {}
        metrics = {}
        
        for agent_name, result in successful_results.items():
            try:
                # Safely get confidence with default
                confidence = float(result.get('confidence', 0.0))
                confidences.append(confidence)
                
                # Extract risk factors (handle different formats)
                metadata = result.get('metadata', {})
                agent_risks = metadata.get('risk_factors', {})
                if isinstance(agent_risks, dict):
                    for risk, details in agent_risks.items():
                        if not isinstance(details, dict):
                            details = {'severity': float(details) if str(details).replace('.', '').isdigit() else 0.5}
                        if 'severity' not in details:
                            details['severity'] = 0.5  # Default severity if not provided
                        if risk not in risk_factors:
                            risk_factors[risk] = []
                        risk_factors[risk].append(details)
                
                # Extract opportunities (handle different formats)
                agent_opps = metadata.get('opportunities', {})
                if isinstance(agent_opps, dict):
                    for opp, details in agent_opps.items():
                        if not isinstance(details, dict):
                            details = {'potential': float(details) if str(details).replace('.', '').isdigit() else 0.5}
                        if 'potential' not in details:
                            details['potential'] = 0.5  # Default potential if not provided
                        if opp not in opportunities:
                            opportunities[opp] = []
                        opportunities[opp].append(details)
                
                # Extract metrics (handle different formats)
                agent_metrics = metadata.get('metrics', {})
                if isinstance(agent_metrics, dict):
                    for metric, value in agent_metrics.items():
                        if metric not in metrics:
                            metrics[metric] = []
                        try:
                            # Try to convert to float if possible
                            metrics[metric].append(float(value) if value is not None else 0.0)
                        except (ValueError, TypeError):
                            metrics[metric].append(str(value) if value is not None else '')
                
            except Exception as e:
                logger.error(f"Error processing result from {agent_name}: {str(e)}", exc_info=True)
                continue
        
        try:
            # Calculate average confidence with fallback
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            # Calculate risk score (0-1, lower is better) with fallbacks
            risk_score = 0.5  # Default neutral risk
            if risk_factors:
                try:
                    risk_score = sum(
                        sum(float(r.get('severity', 0)) for r in risks) / len(risks)
                        for risks in risk_factors.values()
                    ) / len(risk_factors)
                except (TypeError, ValueError):
                    logger.warning("Error calculating risk score, using default 0.5")
            
            # Calculate opportunity score (0-1, higher is better) with fallbacks
            opp_score = 0.5  # Default neutral opportunity
            if opportunities:
                try:
                    opp_score = sum(
                        sum(float(o.get('potential', 0)) for o in opps) / len(opps)
                        for opps in opportunities.values()
                    ) / len(opportunities)
                except (TypeError, ValueError):
                    logger.warning("Error calculating opportunity score, using default 0.5")
            
            # Generate verdict based on risk/opportunity matrix with fallbacks
            try:
                if risk_score < 0.3 and opp_score > 0.7:
                    verdict = 'STRONG_INVEST'
                elif risk_score < 0.5 and opp_score > 0.5:
                    verdict = 'INVEST'
                elif risk_score < 0.7 and opp_score > 0.3:
                    verdict = 'CONSIDER'
                elif risk_score >= 0.7 and opp_score < 0.3:
                    verdict = 'PASS'
                else:
                    verdict = 'HOLD'
            except Exception as e:
                logger.error(f"Error determining verdict: {str(e)}", exc_info=True)
                verdict = 'HOLD'
            
            # Generate consensus metrics with fallbacks
            successful_analyses = len(confidences)
            total_analyses = len(agent_results)
            consensus = successful_analyses / total_analyses if total_analyses > 0 else 0.0
            
            # Safely aggregate key metrics
            aggregated_metrics = {}
            for metric, values in metrics.items():
                if not values:
                    continue
                try:
                    # Try to handle numeric metrics
                    numeric_values = [v for v in values if isinstance(v, (int, float))]
                    if numeric_values:
                        aggregated_metrics[metric] = sum(numeric_values) / len(numeric_values)
                    # Fall back to string representation for non-numeric
                    elif values:
                        str_values = [str(v) for v in values if v is not None]
                        if str_values:
                            aggregated_metrics[metric] = max(set(str_values), key=str_values.count)
                except Exception as e:
                    logger.warning(f"Error aggregating metric {metric}: {str(e)}")
                    aggregated_metrics[metric] = values[0]  # Just take the first value as fallback
            
            # Prepare risk assessment summary with fallbacks
            risk_summary = {'overall_risk_score': risk_score, 'high_risk_areas': [], 'risk_factors': {}}
            try:
                high_risk_areas = []
                for risk, risks in risk_factors.items():
                    try:
                        avg_severity = sum(float(r.get('severity', 0)) for r in risks) / len(risks)
                        if avg_severity > 0.5:  # Only include high risks
                            mitigations = set()
                            for r in risks:
                                if isinstance(r.get('mitigation'), list):
                                    mitigations.update(str(m) for m in r['mitigation'] if m)
                                elif r.get('mitigation'):
                                    mitigations.add(str(r['mitigation']))
                            
                            high_risk_areas.append({
                                'risk': str(risk),
                                'average_severity': avg_severity,
                                'mitigation_suggestions': list(mitigations) if mitigations else ["No mitigations provided"]
                            })
                    except Exception as e:
                        logger.warning(f"Error processing risk {risk}: {str(e)}")
                
                risk_summary = {
                    'overall_risk_score': risk_score,
                    'high_risk_areas': high_risk_areas,
                    'risk_factors': {str(k): v for k, v in risk_factors.items()}
                }
            except Exception as e:
                logger.error(f"Error preparing risk summary: {str(e)}", exc_info=True)
            
            # Prepare opportunities summary with fallbacks
            opportunity_summary = {'overall_opportunity_score': opp_score, 'key_opportunities': [], 'detailed_opportunities': {}}
            try:
                key_opportunities = []
                for opp, opps in opportunities.items():
                    try:
                        avg_potential = sum(float(o.get('potential', 0)) for o in opps) / len(opps)
                        actions = set()
                        for o in opps:
                            if isinstance(o.get('actions'), list):
                                actions.update(str(a) for a in o['actions'] if a)
                            elif o.get('actions'):
                                actions.add(str(o['actions']))
                        
                        key_opportunities.append({
                            'area': str(opp),
                            'average_potential': avg_potential,
                            'key_actions': list(actions) if actions else ["No specific actions provided"]
                        })
                    except Exception as e:
                        logger.warning(f"Error processing opportunity {opp}: {str(e)}")
                
                opportunity_summary = {
                    'overall_opportunity_score': opp_score,
                    'key_opportunities': key_opportunities,
                    'detailed_opportunities': {str(k): v for k, v in opportunities.items()}
                }
            except Exception as e:
                logger.error(f"Error preparing opportunity summary: {str(e)}", exc_info=True)
            
        except Exception as e:
            logger.critical(f"Critical error in verdict generation: {str(e)}", exc_info=True)
            # Return a safe default verdict
            return default_verdict
            
        return {
            'verdict': verdict,
            'confidence': avg_confidence,
            'consensus': consensus,
            'successful_analyses': successful_analyses,
            'total_analyses': total_analyses,
            'risk_assessment': risk_summary,
            'opportunities': opportunity_summary,
            'key_metrics': aggregated_metrics,
            'verdict_reasons': self._generate_verdict_reasons(agent_results, avg_confidence)
        }
    
    def _generate_verdict_reasons(self, agent_results: Dict[str, Any], confidence: float) -> List[Dict[str, Any]]:
        """Generate structured reasons for the verdict with supporting evidence.
        
        Args:
            agent_results: Dictionary containing analysis results from all agents
            confidence: Confidence score (0-1)
            
        Returns:
            List of structured reason objects with:
            - category: The category of reason (e.g., 'market', 'team', 'financial')
            - impact: The impact level (high/medium/low)
            - description: Detailed description
            - supporting_evidence: List of supporting points
            - source_agents: Which agents contributed to this reason
        """
        reasons = []
        
        # Extract and categorize reasons from all agents
        all_reasons = {}
        
        for agent_name, result in agent_results.items():
            if not result.get('success'):
                continue
                
            metadata = result.get('metadata', {})
            
            # Process structured reasons if available
            if 'reasons' in metadata and isinstance(metadata['reasons'], list):
                for reason in metadata['reasons']:
                    category = reason.get('category', 'general')
                    if category not in all_reasons:
                        all_reasons[category] = {
                            'impact': 0,
                            'descriptions': [],
                            'evidence': [],
                            'agents': set()
                        }
                    
                    all_reasons[category]['impact'] = max(
                        all_reasons[category]['impact'],
                        reason.get('impact', 0)
                    )
                    if 'description' in reason:
                        all_reasons[category]['descriptions'].append(reason['description'])
                    if 'evidence' in reason:
                        all_reasons[category]['evidence'].extend(
                            e for e in reason['evidence'] 
                            if e not in all_reasons[category]['evidence']
                        )
                    all_reasons[category]['agents'].add(agent_name)
            
            # Fallback to unstructured content
            elif 'content' in result and result['content']:
                if 'unstructured' not in all_reasons:
                    all_reasons['unstructured'] = {
                        'impact': 1,
                        'descriptions': [],
                        'evidence': [],
                        'agents': set()
                    }
                all_reasons['unstructured']['descriptions'].append(result['content'])
                all_reasons['unstructured']['agents'].add(agent_name)
        
        # Convert to structured output
        for category, data in all_reasons.items():
            # Skip empty categories
            if not data['descriptions'] and not data['evidence']:
                continue
                
            # Determine impact level
            impact_level = 'medium'
            if data['impact'] > 0.7:
                impact_level = 'high'
            elif data['impact'] < 0.3:
                impact_level = 'low'
            
            # Combine descriptions
            description = ' '.join(data['descriptions'][:3])  # Limit to first 3 descriptions
            
            # Get top 3 pieces of evidence
            evidence = data['evidence'][:3]
            
            reasons.append({
                'category': category,
                'impact': impact_level,
                'description': description,
                'supporting_evidence': evidence,
                'source_agents': list(data['agents'])
            })
        
        # Sort by impact (high to low) and limit to top 5 reasons
        reasons.sort(key=lambda x: x['impact'] == 'high', reverse=True)
        return reasons[:5]
    
    def _generate_summary(self, agent_results: Dict[str, Any], verdict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a comprehensive summary of the analysis with structured data.
        
        Args:
            agent_results: Dictionary containing analysis results from all agents
            verdict: Final verdict from the committee with risk/opportunity data
            
        Returns:
            Dict containing the analysis summary with structured sections:
            - executive_summary: High-level overview
            - investment_case: Key reasons to invest
            - risk_assessment: Key risks and mitigations
            - growth_opportunities: Potential areas for growth
            - key_metrics: Important business metrics
            - next_steps: Recommended actions
        """
        # Calculate basic stats
        successful = sum(1 for r in agent_results.values() if r.get('success', False))
        failed = len(agent_results) - successful
        confidence = verdict.get('confidence', 0.0)
        
        # Prepare executive summary
        executive_summary = [
            f"# Investment Analysis Summary",
            f"**Verdict:** {verdict.get('verdict', 'UNKNOWN')}",
            f"**Confidence:** {confidence:.1%}",
            f"**Committee Consensus:** {verdict.get('consensus', 0.0):.0%} ({successful}/{len(agent_results)} agents)",
            "",
            "## Overview"
        ]
        
        # Add verdict reasons to summary
        if 'verdict_reasons' in verdict and verdict['verdict_reasons']:
            executive_summary.append("### Key Investment Considerations:")
            for reason in verdict['verdict_reasons']:
                executive_summary.append(
                    f"- **{reason['category'].title()}** ({reason['impact'].upper()} impact): "
                    f"{reason['description']}"
                )
        
        # Add risk assessment
        risk_assessment = ["## Risk Assessment"]
        if 'risk_assessment' in verdict and 'high_risk_areas' in verdict['risk_assessment']:
            if verdict['risk_assessment']['high_risk_areas']:
                risk_assessment.append("### High Risk Areas:")
                for risk in verdict['risk_assessment']['high_risk_areas']:
                    risk_assessment.append(
                        f"- **{risk['risk'].replace('_', ' ').title()}** (Severity: {risk['average_severity']:.1f}/1.0)"
                    )
                    if risk.get('mitigation_suggestions'):
                        risk_assessment.append("  - *Mitigation:* " + "; ".join(risk['mitigation_suggestions']))
            else:
                risk_assessment.append("No critical risks identified.")
        
        # Add growth opportunities
        growth_opportunities = ["## Growth Opportunities"]
        if 'opportunities' in verdict and 'key_opportunities' in verdict['opportunities']:
            for opp in verdict['opportunities']['key_opportunities']:
                growth_opportunities.append(
                    f"- **{opp['area'].replace('_', ' ').title()}** (Potential: {opp['average_potential']:.1f}/1.0)"
                )
                if opp.get('key_actions'):
                    growth_opportunities.append("  - *Actions:* " + "; ".join(opp['key_actions']))
        
        # Add key metrics
        key_metrics = ["## Key Metrics"]
        if 'key_metrics' in verdict and verdict['key_metrics']:
            for metric, value in verdict['key_metrics'].items():
                if isinstance(value, (int, float)):
                    # Format numbers with appropriate precision
                    if abs(value) >= 1000000:
                        formatted = f"{value/1000000:.1f}M"
                    elif abs(value) >= 1000:
                        formatted = f"{value/1000:.1f}K"
                    else:
                        formatted = f"{value:.2f}"                    
                    key_metrics.append(f"- **{metric.replace('_', ' ').title()}:** {formatted}")
                else:
                    key_metrics.append(f"- **{metric.replace('_', ' ').title()}:** {value}")
        
        # Add next steps
        next_steps = ["## Next Steps"]
        if verdict['verdict'] in ['STRONG_INVEST', 'INVEST']:
            next_steps.extend([
                "- Schedule management team interview",
                "- Begin due diligence process",
                "- Review cap table and investment terms",
                "- Prepare term sheet"
            ])
        elif verdict['verdict'] == 'CONSIDER':
            next_steps.extend([
                "- Request additional information on key risk areas",
                "- Schedule follow-up with founding team",
                "- Conduct market validation"
            ])
        else:
            next_steps.append("- No further action recommended at this time")
        
        # Combine all sections
        full_summary = "\n\n".join([
            "\n".join(executive_summary),
            "\n".join(risk_assessment),
            "\n".join(growth_opportunities),
            "\n".join(key_metrics),
            "\n".join(next_steps)
        ])
        
        # Prepare structured return value
        return {
            'executive_summary': "\n".join(executive_summary),
            'risk_assessment': "\n".join(risk_assessment),
            'growth_opportunities': "\n".join(growth_opportunities),
            'key_metrics': "\n".join(key_metrics),
            'next_steps': "\n".join(next_steps),
            'text': full_summary,
            'successful_agents': successful,
            'failed_agents': failed,
            'confidence': confidence,
            'verdict': verdict.get('verdict', 'UNKNOWN'),
            'metadata': {
                'analysis_timestamp': datetime.utcnow().isoformat(),
                'agent_count': len(agent_results),
                'risk_score': verdict.get('risk_assessment', {}).get('overall_risk_score', 0.0),
                'opportunity_score': verdict.get('opportunities', {}).get('overall_opportunity_score', 0.0)
            }
        }
