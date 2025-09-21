from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import re
import json
import logging
import asyncio
from functools import lru_cache

# Import ADK-based agent system
from app.services.agents import (
    ADKAgentManager,
    ADKAgent,
    create_agent_manager,
    create_financial_analyst,
    create_market_analyst,
    create_technical_analyst
)
from app.config import settings

router = APIRouter(prefix="/deal-analysis", tags=["deal-analysis"])
logger = logging.getLogger(__name__)

@lru_cache(maxsize=1)
def get_agent_manager() -> ADKAgentManager:
    """Get a cached instance of the agent manager."""
    logger.info("Initializing ADK agent manager")
    return create_agent_manager(
        project_id=settings.GOOGLE_CLOUD_PROJECT,
        location=getattr(settings, "GOOGLE_CLOUD_LOCATION", "us-central1")
    )

def extract_json_from_response(response: str) -> dict:
    """Extract JSON from AI response, handling various formats."""
    try:
        # First try direct JSON parsing
        return json.loads(response)
    except json.JSONDecodeError:
        pass

    # Try to find JSON within the response using regex
    json_patterns = [
        r'\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}',  # Simple nested JSON
        r'```json\s*(\{.*?\})\s*```',  # JSON in code blocks
        r'```\s*(\{.*?\})\s*```',  # JSON in code blocks without language
        r'(\{[^{}]*\{[^{}]*\}[^{}]*\})',  # Nested JSON objects
    ]

    for pattern in json_patterns:
        matches = re.findall(pattern, response, re.DOTALL)
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue

    # If no JSON found, try to clean up the response and parse
    cleaned_response = response.strip()
    if cleaned_response.startswith('{') and cleaned_response.endswith('}'):
        try:
            return json.loads(cleaned_response)
        except json.JSONDecodeError:
            pass

    raise json.JSONDecodeError("No valid JSON found in response", response, 0)

def extract_analysis_from_text(text: str, role: str) -> dict:
    """Extract analysis information from raw text response when JSON parsing fails."""
    text_lower = text.lower()

    # Determine vote based on keywords in the response
    invest_keywords = ['invest', 'strong buy', 'recommend invest', 'positive', 'bullish', 'excited about', 'great opportunity']
    pass_keywords = ['pass', 'not invest', 'concerns', 'red flags', 'avoid', 'negative', 'bearish', 'risky']
    consider_keywords = ['consider', 'maybe', 'further due diligence', 'mixed', 'neutral', 'wait and see']

    if any(keyword in text_lower for keyword in invest_keywords):
        vote = "INVEST"
        confidence = 70.0
    elif any(keyword in text_lower for keyword in pass_keywords):
        vote = "PASS"
        confidence = 60.0
    elif any(keyword in text_lower for keyword in consider_keywords):
        vote = "CONSIDER"
        confidence = 50.0
    else:
        vote = "CONSIDER"
        confidence = 40.0

    # Extract analysis content (first meaningful paragraph or sentence)
    lines = text.strip().split('\n')
    analysis_lines = []
    reasoning_lines = []

    for line in lines:
        line = line.strip()
        if len(line) > 20 and not line.startswith('```') and not line.startswith('{'):
            if not analysis_lines:
                analysis_lines.append(line)
            else:
                reasoning_lines.append(line)

    analysis = analysis_lines[0] if analysis_lines else f"Analysis provided by {role}"
    reasoning = reasoning_lines[0] if reasoning_lines else f"Based on {role.lower()} perspective"

    # Role-based confidence adjustment
    role_confidence_map = {
        "Risk Analyst": 0.8,  # Conservative
        "Market Expert": 0.7,  # Optimistic
        "Finance Partner": 0.9,  # Data-driven
        "Skeptical VC": 0.6  # Skeptical
    }

    confidence = min(confidence * role_confidence_map.get(role, 0.7), 100.0)

    return {
        "analysis": analysis,
        "vote": vote,
        "confidence": confidence,
        "reasoning": reasoning
    }

class DealAnalysisRequest(BaseModel):
    pitch: str = Field(..., description="The startup pitch to analyze")
    include_benchmarks: bool = Field(False, description="Whether to include benchmark comparisons")

class InvestmentMetrics(BaseModel):
    market_size: Dict[str, str]
    revenue_model: str
    growth_rate: str
    team_strength: str
    competitive_advantage: str
    unit_economics: Optional[Dict[str, str]] = None
    funding_ask: Optional[Dict[str, Any]] = None
    
class InvestmentRisk(BaseModel):
    risk: str
    probability: str  # High/Medium/Low
    impact: str       # High/Medium/Low
    mitigation: str
    
class InvestmentRecommendation(BaseModel):
    type: str  # product/market/team/financial
    action: str
    priority: str  # High/Medium/Low
    timeline: str
    expected_outcome: str

class DealAnalysisResponse(BaseModel):
    verdict: str  # STRONG_INVEST/INVEST/CONSIDER/HOLD/PASS
    confidence_score: float  # 0-100
    investment_thesis: str
    valuation_assessment: Dict[str, Any]
    key_metrics: Dict[str, Any]
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]
    investment_risks: List[InvestmentRisk]
    recommendations: List[InvestmentRecommendation]
    next_steps: List[str]
    monitoring_metrics: List[str]
    committee_questions: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CommitteeMember(BaseModel):
    name: str
    role: str
    personality: str
    analysis: str
    vote: str
    confidence: float
    reasoning: str

class InvestmentCommitteeResponse(BaseModel):
    deal_pitch: str
    committee_members: List[CommitteeMember]
    final_verdict: str
    consensus_score: float
    majority_vote: str
    dissenting_opinions: List[str]
    key_debate_points: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

DEAL_ANALYSIS_SYSTEM_PROMPT = """You are a senior venture capital partner with 20+ years of experience at top-tier firms like Sequoia Capital, Andreessen Horowitz, and Benchmark. You specialize in early to growth-stage technology investments and have led investments in multiple unicorn companies.

INVESTMENT THESIS FRAMEWORK:

1. MARKET ANALYSIS (25% weight)
- Total Addressable Market (TAM): Quantify with supporting data
- Market Growth Rate: Historical and projected CAGR
- Competitive Landscape: Market share distribution and competitive moats
- Market Trends: Key drivers and potential disruptors
- Customer Pain Points: How well does the solution address real needs?

2. TEAM ASSESSMENT (25% weight)
- Founder/CEO: Track record, domain expertise, leadership qualities
- Technical Team: Relevant experience and technical depth
- Advisory Board: Industry connections and strategic value
- Hiring Strategy: Ability to attract top talent
- Cultural Fit: Alignment with investment thesis

3. PRODUCT & TECHNOLOGY (20% weight)
- Innovation Level: Technological differentiation
- Product-Market Fit: Evidence of strong demand
- Technical Scalability: Architecture and infrastructure
- IP Portfolio: Patents, trademarks, trade secrets
- Development Roadmap: Realistic and ambitious

4. BUSINESS MODEL (15% weight)
- Revenue Model: Clear path to monetization
- Unit Economics: CAC, LTV, payback period
- Sales Cycle: Length and predictability
- Customer Acquisition: Channels and scalability
- Margins: Current and projected

5. TRACTION & METRICS (15% weight)
- Revenue Growth: MoM/QoQ trends
- Customer Acquisition: Growth and retention metrics
- Engagement: Usage metrics and stickiness
- Churn: Customer and revenue churn rates
- Network Effects: Evidence of increasing returns

6. RISK ASSESSMENT (10% weight)
- Market Risks: Competition, market shifts
- Execution Risks: Team, technology, operations
- Financial Risks: Burn rate, runway, funding needs
- Regulatory Risks: Compliance requirements
- Technical Risks: Scalability, security, tech debt

VERDICT FRAMEWORK:

1. INVESTMENT RECOMMENDATION (Select one):
- "STRONG_INVEST" (80-100%): Exceptional opportunity with clear market leadership potential
- "INVEST" (70-79%): Strong opportunity with manageable risks
- "CONSIDER" (50-69%): Potential with significant risks or uncertainties
- "HOLD" (30-49%): Monitor for improvements in key metrics
- "PASS" (0-29%): Does not meet investment criteria

2. INVESTMENT THESIS:
- Clear, concise statement on why this is a good/bad investment
- Key value drivers and differentiators
- Potential exit scenarios and timeline

3. DUE DILIGENCE CHECKLIST:
- Critical questions that need answering
- Key risks that require mitigation
- Must-have metrics for next funding round

4. TERM SHEET RECOMMENDATIONS:
- Valuation range
- Key terms to include (liquidation preferences, board seats, etc.)
- Milestone-based funding recommendations

5. VALUE-ADD OPPORTUNITIES:
- Strategic partnerships
- Key hires needed
- Operational improvements

JSON RESPONSE FORMAT:
{
    "verdict": "STRONG_INVEST/INVEST/CONSIDER/HOLD/PASS",
    "confidence_score": 0-100,
    "investment_thesis": "2-3 sentence summary of the investment opportunity",
    "valuation_assessment": {
        "pre_money_valuation_range": "$X-$Y million",
        "valuation_metrics": ["Metric 1", "Metric 2"],
        "comparable_companies": ["Peer 1", "Peer 2"]
    },
    "key_metrics": {
        "market_metrics": {
            "tam": "$X billion",
            "sam": "$Y million",
            "growth_rate": "Z% CAGR",
            "market_trends": ["Trend 1", "Trend 2"]
        },
        "business_metrics": {
            "revenue": "$X (TTM)",
            "growth_rate": "Y% MoM",
            "gross_margin": "Z%",
            "cac_ltv_ratio": "X:Y",
            "burn_rate": "$X/month"
        },
        "product_metrics": {
            "active_users": "X (MAU/DAU)",
            "engagement_rate": "X%",
            "nps_score": "X",
            "churn_rate": "X%"
        }
    },
    "strengths": ["Strength 1 with impact", "Strength 2 with impact"],
    "weaknesses": ["Weakness 1 with mitigation", "Weakness 2 with mitigation"],
    "opportunities": ["Opportunity 1 with potential impact", "Opportunity 2 with potential impact"],
    "threats": ["Threat 1 with probability", "Threat 2 with probability"],
    "investment_risks": [
        {
            "risk": "Risk description",
            "probability": "High/Medium/Low",
            "impact": "High/Medium/Low",
            "mitigation": "Mitigation strategy"
        }
    ],
    "recommendations": [
        {
            "type": "investment/partnership/hiring/product",
            "action": "Specific action item",
            "priority": "High/Medium/Low",
            "timeline": "Timeframe",
            "expected_outcome": "Expected result"
        }
    ],
    "next_steps": ["Immediate action 1", "Short-term action 2", "Long-term action 3"],
    "monitoring_metrics": ["Metric 1 to track", "Metric 2 to track"],
    "committee_questions": ["Key question 1", "Key question 2"]
}

IMPORTANT:
1. Be brutally honest in your assessment
2. Back all claims with specific evidence from the pitch
3. Provide actionable insights, not just observations
4. Quantify your analysis where possible
5. Consider both short-term execution and long-term potential"""

# Investment Committee System Prompts
COMMITTEE_MEMBERS = {
    "sarah": {
        "name": "Sarah Chen",
        "role": "Risk Analyst",
        "personality": "Conservative, detail-oriented, focuses on downside protection and risk mitigation. Always asks 'what could go wrong?'",
        "system_prompt": """You are Sarah Chen, Senior Risk Analyst at a top VC firm. You have 12 years of experience identifying and mitigating investment risks.

Your personality:
- Conservative and methodical
- Focus on downside protection
- Always consider worst-case scenarios
- Question assumptions and identify red flags
- Prioritize capital preservation

In committee discussions, you tend to be cautious and often highlight potential risks that others might overlook.

For the given startup pitch, provide:
1. Your detailed risk analysis (3-4 sentences max)
2. Your vote: STRONG_INVEST / CONSIDER / HIGH_RISK / PASS
3. Your confidence level (0-100)
4. Your specific reasoning for the vote (2-3 sentences)
5. Key risk factors you identified (2-3 bullet points)

CRITICAL: Respond with ONLY valid JSON. No explanatory text, no markdown, no code blocks.

JSON Format:
{
    "analysis": "Concise risk analysis in 3-4 sentences maximum...",
    "vote": "STRONG_INVEST/CONSIDER/HIGH_RISK/PASS",
    "confidence": 75,
    "reasoning": "Clear reasoning in 2-3 sentences explaining your vote...",
    "key_risks": ["Risk 1", "Risk 2", "Risk 3"]
}"""
    },

    "marcus": {
        "name": "Marcus Rodriguez",
        "role": "Market Expert",
        "personality": "Market-savvy, growth-focused, identifies trends and market opportunities. Optimistic about disruptive potential.",
        "system_prompt": """You are Marcus Rodriguez, Principal and Market Expert at a leading VC firm. You have 10 years of experience in market analysis and trend identification.

Your personality:
- Market-savvy and trend-focused
- Optimistic about disruptive innovations
- Focus on market timing and growth potential
- Identify whitespace and expansion opportunities
- Strategic thinker with big-picture vision

In committee discussions, you often champion bold, disruptive ideas and market opportunities.

For the given startup pitch, provide:
1. Your market analysis and opportunity assessment (3-4 sentences max)
2. Your vote: STRONG_INVEST / CONSIDER / HIGH_RISK / PASS
3. Your confidence level (0-100)
4. Your specific reasoning for the vote (2-3 sentences)
5. Key market opportunities you identified (2-3 bullet points)

CRITICAL: Respond with ONLY valid JSON. No explanatory text, no markdown, no code blocks.

JSON Format:
{
    "analysis": "Concise market analysis in 3-4 sentences maximum...",
    "vote": "STRONG_INVEST/CONSIDER/HIGH_RISK/PASS",
    "confidence": 75,
    "reasoning": "Clear reasoning in 2-3 sentences explaining your vote...",
    "key_opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"]
}"""
    },

    "elizabeth": {
        "name": "Dr. Elizabeth Thompson",
        "role": "Finance Partner",
        "personality": "Numbers-driven, analytical, focuses on financial metrics and unit economics. Data-first decision maker.",
        "system_prompt": """You are Dr. Elizabeth Thompson, Finance Partner at a premier VC firm. You have a PhD in Finance and 15 years of experience in financial modeling and due diligence.

Your personality:
- Numbers-driven and analytical
- Focus on unit economics and financial metrics
- Data-first approach to decision making
- Thorough in financial due diligence
- ROI and efficiency focused

In committee discussions, you provide the quantitative backbone and financial rationale for investment decisions.

For the given startup pitch, provide:
1. Your financial analysis and unit economics assessment (3-4 sentences max)
2. Your vote: STRONG_INVEST / CONSIDER / HIGH_RISK / PASS
3. Your confidence level (0-100)
4. Your specific reasoning for the vote (2-3 sentences)
5. Key financial metrics and considerations (2-3 bullet points)

CRITICAL: Respond with ONLY valid JSON. No explanatory text, no markdown, no code blocks.

JSON Format:
{
    "analysis": "Concise financial analysis in 3-4 sentences maximum...",
    "vote": "STRONG_INVEST/CONSIDER/HIGH_RISK/PASS",
    "confidence": 75,
    "reasoning": "Clear reasoning in 2-3 sentences explaining your vote...",
    "key_metrics": {"CAC": "$150", "LTV": "$300", "Payback": "6 months"}
}"""
    },

    "david": {
        "name": "David Park",
        "role": "Skeptical VC",
        "personality": "Experienced, battle-hardened VC who has seen many failures. Questions everything and demands proof of concept.",
        "system_prompt": """You are David Park, Managing Partner at a successful VC firm. You have 20 years of experience and have seen hundreds of startups succeed and fail.

Your personality:
- Experienced and battle-hardened
- Skeptical by nature - question everything
- Demand proof of concept and validation
- Focus on execution capability and market validation
- Pattern recognition from past successes/failures

In committee discussions, you often play devil's advocate and ask the tough questions that others avoid.

For the given startup pitch, provide:
1. Your skeptical analysis and critical assessment (3-4 sentences max)
2. Your vote: STRONG_INVEST / CONSIDER / HIGH_RISK / PASS
3. Your confidence level (0-100)
4. Your specific reasoning for the vote (2-3 sentences)
5. Key concerns and validation requirements (2-3 bullet points)

CRITICAL: Respond with ONLY valid JSON. No explanatory text, no markdown, no code blocks.

JSON Format:
{
    "analysis": "Concise skeptical analysis in 3-4 sentences maximum...",
    "vote": "STRONG_INVEST/CONSIDER/HIGH_RISK/PASS",
    "confidence": 75,
    "reasoning": "Clear reasoning in 2-3 sentences explaining your vote...",
    "key_concerns": ["Concern 1", "Concern 2", "Concern 3"]
}"""
    }
}

@router.post("/analyze", response_model=DealAnalysisResponse)
async def analyze_deal(
    deal_request: DealAnalysisRequest,
    manager: ADKAgentManager = Depends(get_agent_manager)
):
    """
    Analyze a startup pitch using the ADK-based agent system.
    """
    try:
        # Prepare context for the analysis
        context = {
            "pitch": deal_request.pitch,
            "include_benchmarks": str(deal_request.include_benchmarks),
            "analysis_type": "comprehensive",
            "timestamp": datetime.utcnow().isoformat()
        }

        # Get specialized analyses
        financial_analyst = create_financial_analyst(
            project_id=settings.GOOGLE_CLOUD_PROJECT,
            location=getattr(settings, "GOOGLE_CLOUD_LOCATION", "us-central1")
        )
        
        market_analyst = create_market_analyst(
            project_id=settings.GOOGLE_CLOUD_PROJECT,
            location=getattr(settings, "GOOGLE_CLOUD_LOCATION", "us-central1")
        )

        # Run analyses in parallel
        financial_task = asyncio.create_task(
            financial_analyst.process_message("Analyze financials and valuation", context)
        )
        market_task = asyncio.create_task(
            market_analyst.process_message("Analyze market opportunity and competition", context)
        )

        # Wait for all analyses to complete
        financial_result, market_result = await asyncio.gather(financial_task, market_task)

        # Combine results
        combined_analysis = {
            "verdict": "CONSIDER",
            "confidence_score": 0.75,
            "investment_thesis": "",
            "valuation_assessment": {},
            "key_metrics": {},
            "strengths": [],
            "weaknesses": [],
            "opportunities": [],
            "threats": [],
            "investment_risks": [],
            "recommendations": [],
            "next_steps": ["Schedule call with founders", "Review detailed financials"],
            "monitoring_metrics": ["MRR growth", "Customer acquisition cost", "Burn rate"],
            "committee_questions": []
        }

        # Process financial analysis
        if financial_result.success:
            try:
                financial_data = json.loads(financial_result.content) if isinstance(financial_result.content, str) else financial_result.content
                combined_analysis.update({
                    "valuation_assessment": financial_data.get("valuation", {}),
                    "key_metrics": financial_data.get("metrics", {})
                })
                if "verdict" in financial_data:
                    combined_analysis["verdict"] = financial_data["verdict"]
                if "confidence" in financial_data:
                    combined_analysis["confidence_score"] = financial_data["confidence"]
            except Exception as e:
                logger.error(f"Error processing financial analysis: {str(e)}")

        # Process market analysis
        if market_result.success:
            try:
                market_data = json.loads(market_result.content) if isinstance(market_result.content, str) else market_result.content
                combined_analysis.update({
                    "market_analysis": market_data.get("analysis", ""),
                    "market_size": market_data.get("market_size", {})
                })
                # Update verdict based on market analysis if needed
                if market_data.get("verdict") == "PASS" and combined_analysis["verdict"] != "PASS":
                    combined_analysis["verdict"] = "HIGH_RISK"
            except Exception as e:
                logger.error(f"Error processing market analysis: {str(e)}")

        return DealAnalysisResponse(**combined_analysis)

    except Exception as e:
        logger.error(f"Error analyzing deal: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing deal: {str(e)}"
        )

@router.post("/committee-simulate", response_model=InvestmentCommitteeResponse)
async def simulate_investment_committee(
    deal_request: DealAnalysisRequest
):
    """
    Simulate an investment committee meeting with different perspectives.
    """
    try:
        # Define committee members with different perspectives
        committee_roles = [
            {"name": "Sarah Chen", "role": "Partner - Growth Equity", "focus": "Market expansion and scaling"},
            {"name": "James Wilson", "role": "Partner - Early Stage", "focus": "Product-market fit and team"},
            {"name": "Dr. Emily Zhang", "role": "Technical Partner", "focus": "Technology and IP assessment"},
            {"name": "Michael Rodriguez", "role": "Partner - Finance", "focus": "Financial modeling and metrics"},
            {"name": "Priya Patel", "role": "Partner - Impact", "focus": "ESG and impact potential"}
        ]

        # Create a temporary agent for each committee member
        committee_tasks = []
        for member in committee_roles:
            # Create a valid agent name by replacing any non-alphanumeric characters with underscores
            # and ensuring it starts with a letter or underscore
            safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', member['name'].lower())
            if not safe_name[0].isalpha() and safe_name[0] != '_':
                safe_name = f'_{safe_name}'
                
            agent = ADKAgent(
                name=f"committee_{safe_name}",
                instructions=f"""
                You are {member['name']}, {member['role']} at a top VC firm.
                Your focus is on {member['focus']}.

                Analyze the startup pitch and provide:
                1. A brief analysis from your perspective
                2. Your vote: STRONG_INVEST/INVEST/CONSIDER/HIGH_RISK/PASS
                3. Your confidence level (0-1)
                4. 2-3 key points about the opportunity

                Format your response as JSON with these fields:
                - analysis: Your analysis
                - vote: Your vote
                - confidence: Your confidence level (0-1)
                - key_points: List of key points
                """,
                model="gemini-1.5-pro"
            )
            
            # Create task for this committee member
            task = asyncio.create_task(
                agent.process_message(
                    f"Startup Pitch:\n{deal_request.pitch}\n\n"
                    f"Please provide your analysis and vote as {member['name']}."
                )
            )
            committee_tasks.append((member, task))
        
        # Gather all responses
        committee_members = []
        for member, task in committee_tasks:
            try:
                response = await task
                if response.success:
                    try:
                        analysis = json.loads(response.content) if isinstance(response.content, str) else response.content
                        committee_members.append({
                            "name": member["name"],
                            "role": member["role"],
                            "analysis": analysis.get("analysis", ""),
                            "vote": analysis.get("vote", "Abstain"),
                            "confidence": float(analysis.get("confidence", 0.5)),
                            "key_points": analysis.get("key_points", [])
                        })
                    except Exception as e:
                        logger.error(f"Error parsing committee member response: {str(e)}")
                        committee_members.append({
                            "name": member["name"],
                            "role": member["role"],
                            "analysis": "Error in analysis",
                            "vote": "Abstain",
                            "confidence": 0.0,
                            "key_points": []
                        })
            except Exception as e:
                logger.error(f"Error getting committee member response: {str(e)}")
                committee_members.append({
                    "name": member["name"],
                    "role": member["role"],
                    "analysis": "Unable to provide analysis",
                    "vote": "Abstain",
                    "confidence": 0.0,
                    "key_points": []
                })

        # Calculate consensus
        votes = [m.get("vote", "Abstain") for m in committee_members]
        vote_options = ["STRONG_INVEST", "INVEST", "CONSIDER", "HIGH_RISK", "PASS", "Abstain"]
        vote_counts = {vote: votes.count(vote) for vote in vote_options}

        # Determine majority vote (excluding abstentions)
        voting_votes = {k: v for k, v in vote_counts.items() if k != "Abstain"}
        majority_vote = max(voting_votes, key=voting_votes.get) if voting_votes else "Abstain"

        # Calculate consensus score (0-1, where 1 = unanimous, excluding abstentions)
        total_voting_members = sum(voting_votes.values())
        consensus_score = voting_votes[majority_vote] / total_voting_members if total_voting_members > 0 else 0

        # Determine final verdict
        if consensus_score >= 0.75:  # Strong consensus
            final_verdict = majority_vote
        elif majority_vote == "PASS" and consensus_score >= 0.5:
            final_verdict = "PASS"
        else:
            final_verdict = "CONSIDER"  # Need more discussion

        # Prepare response
        return InvestmentCommitteeResponse(
            deal_pitch=deal_request.pitch,
            committee_members=committee_members,
            final_verdict=final_verdict,
            consensus_score=consensus_score,
            majority_vote=majority_vote,
            dissenting_opinions=[
                f"{m['name']} voted {m['vote']}: {m['analysis']}"
                for m in committee_members 
                if m.get("vote") not in [majority_vote, "Abstain"]
            ][:5],  # Limit to top 5
            key_debate_points=[
                point for member in committee_members 
                for point in member.get("key_points", [])[:2]  # Take top 2 points from each
            ][:10]  # Limit to top 10
        )

    except Exception as e:
        logger.error(f"Error in committee simulation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during committee simulation: {str(e)}"
        )

# Add benchmarking endpoint if needed
@router.get("/benchmarks/{industry}")
async def get_industry_benchmarks(industry: str):
    """
    Get industry benchmarks for comparison.
    """
    # This would typically query a database or external API
    # For now, return some sample data
    return {
        "industry": industry,
        "metrics": {
            "average_valuation": 10000000,
            "average_mrr_growth_rate": 0.15,
            "common_team_size": 5
        }
    }
