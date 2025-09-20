from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import json
import re
from app.services.llm_client import call_llm
import logging

router = APIRouter(prefix="/deal-analysis", tags=["deal-analysis"])
logger = logging.getLogger(__name__)

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

class DealAnalysisResponse(BaseModel):
    verdict: str
    confidence: float
    key_metrics: Dict[str, Any]
    risks: List[str]
    opportunities: List[str]
    recommendations: List[str]
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

DEAL_ANALYSIS_SYSTEM_PROMPT = """You are a senior venture capital partner with 15+ years of experience at top-tier firms like Sequoia Capital, Andreessen Horowitz, and Benchmark. You have evaluated thousands of startup pitches and made investment decisions ranging from $500K seed rounds to $50M+ Series B rounds.

Your expertise includes:
- Deep market analysis and TAM/SAM validation
- Team assessment and founder-market fit evaluation
- Competitive landscape analysis
- Financial modeling and unit economics
- Risk assessment and mitigation strategies
- Exit potential and strategic value

You are now evaluating a startup pitch for potential investment. Provide a comprehensive, professional investment analysis.

CRITICAL REQUIREMENTS:
1. Respond with ONLY valid JSON - no explanatory text, no markdown, no code blocks
2. Base your analysis on the actual pitch content provided
3. Provide specific, actionable reasons for your verdict
4. Include confidence level based on available information
5. Consider both quantitative and qualitative factors

ANALYSIS FRAMEWORK:
1. **Market Opportunity**: Size, growth potential, competitive dynamics
2. **Team Quality**: Founder capabilities, team composition, execution track record
3. **Product Differentiation**: Unique value proposition, technical moats
4. **Business Model**: Revenue model, unit economics, scalability
5. **Competitive Position**: Market share potential, barriers to entry
6. **Risk Factors**: Technical, market, execution, and regulatory risks
7. **Upside Potential**: Growth trajectory, exit opportunities

VERDICT_OPTIONS:
- "STRONG_INVEST": Exceptional opportunity with high confidence (80-100%)
- "CONSIDER": Promising with moderate confidence (50-79%)
- "HIGH_RISK": Significant concerns but potential exists (30-49%)
- "PASS": Major red flags outweigh potential benefits (0-29%)

For each verdict, provide 3-5 specific, professional supporting points that justify your confidence level. Each point should:
- Be specific and actionable
- Reference particular aspects of the pitch
- Explain how it impacts the investment decision
- Indicate the relative importance to your confidence
- Be written as clear, professional bullet points

CONFIDENCE LEVELS:
- 80-100%: High confidence - multiple strong indicators align
- 60-79%: Medium confidence - promising with some concerns
- 40-59%: Low confidence - significant issues present
- 0-39%: Very low confidence - major red flags

Base your confidence score on the strength and consistency of supporting evidence.

JSON FORMAT:
{
    "verdict": "INVEST/CONSIDER/PASS",
    "confidence": 0-100,
    "key_metrics": {
        "market_size": "Estimated TAM/SAM with reasoning",
        "revenue_model": "Revenue streams and viability assessment",
        "growth_rate": "Expected growth trajectory with assumptions",
        "team_strength": "Team quality and execution capability assessment",
        "competitive_advantage": "Moats and differentiation factors"
    },
    "risks": ["Specific risk factor 1", "Specific risk factor 2", "..."],
    "opportunities": ["Growth opportunity 1", "Strategic opportunity 2", "..."],
    "recommendations": ["Actionable next step 1", "Validation step 2", "..."]
}

IMPORTANT: Ensure all required fields are present and that confidence is a number between 0-100."""

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
async def analyze_deal(deal_request: DealAnalysisRequest):
    """
    Analyze a startup pitch and provide a comprehensive investment analysis.
    """
    try:
        # Call the LLM with the pitch and system prompt
        response = await call_llm(
            system_prompt=DEAL_ANALYSIS_SYSTEM_PROMPT,
            user_prompt=deal_request.pitch,
            model="gemini-2.5-flash"
        )
        
        # Parse the response
        try:
            # Clean the response - remove markdown code blocks and extra whitespace
            cleaned_response = response.strip()

            # Remove markdown code blocks if present
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            elif cleaned_response.startswith('```'):
                cleaned_response = cleaned_response[3:]

            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]

            # Remove any leading/trailing whitespace and newlines
            cleaned_response = cleaned_response.strip()

            # Try to find JSON in the response (in case there's extra text)
            json_start = cleaned_response.find('{')
            json_end = cleaned_response.rfind('}') + 1

            if json_start != -1 and json_end > json_start:
                cleaned_response = cleaned_response[json_start:json_end]

            logger.info(f"Cleaned LLM response: {cleaned_response[:200]}...")  # Log first 200 chars

            analysis = json.loads(cleaned_response)

            # Validate the response structure
            required_fields = ["verdict", "confidence", "key_metrics", "risks", "opportunities", "recommendations"]
            if not all(field in analysis for field in required_fields):
                missing_fields = [field for field in required_fields if field not in analysis]
                logger.error(f"Missing fields in LLM response: {missing_fields}")
                raise ValueError(f"Invalid response format from LLM. Missing fields: {missing_fields}")

            return DealAnalysisResponse(**analysis)

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse LLM response: {e}")
            logger.error(f"Raw LLM response: {response}")
            raise HTTPException(
                status_code=500,
                detail="Failed to parse analysis response. Please try again."
            )
            
    except Exception as e:
        logger.error(f"Error in analyze_deal: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while analyzing the pitch: {str(e)}"
        )

@router.post("/committee-simulate", response_model=InvestmentCommitteeResponse)
async def simulate_investment_committee(deal_request: DealAnalysisRequest):
    """
    Simulate an investment committee meeting with multiple AI personas debating a deal.
    """
    try:
        # Run all committee members in parallel
        import asyncio

        async def get_committee_member_analysis(member_id, member_info):
            try:
                response = await call_llm(
                    system_prompt=member_info["system_prompt"],
                    user_prompt=deal_request.pitch,
                    model="gemini-2.5-flash"
                )

                # Enhanced JSON parsing with fallback
                try:
                    # Try to extract JSON from the response
                    analysis_data = extract_json_from_response(response)

                    return CommitteeMember(
                        name=member_info["name"],
                        role=member_info["role"],
                        personality=member_info["personality"],
                        analysis=analysis_data.get("analysis", "Analysis not available"),
                        vote=analysis_data.get("vote", "CONSIDER"),
                        confidence=float(analysis_data.get("confidence", 50.0)),
                        reasoning=analysis_data.get("reasoning", "Reasoning not available")
                    )
                except (json.JSONDecodeError, KeyError, ValueError) as e:
                    logger.warning(f"Failed to parse response from {member_info['name']}: {e}")
                    logger.warning(f"Raw response: {response[:500]}...")

                    # Create fallback analysis based on the raw response
                    fallback_analysis = extract_analysis_from_text(response, member_info["role"])

                    return CommitteeMember(
                        name=member_info["name"],
                        role=member_info["role"],
                        personality=member_info["personality"],
                        analysis=fallback_analysis["analysis"],
                        vote=fallback_analysis["vote"],
                        confidence=fallback_analysis["confidence"],
                        reasoning=fallback_analysis["reasoning"]
                    )

            except Exception as e:
                logger.error(f"Error getting analysis from {member_info['name']}: {e}")
                return CommitteeMember(
                    name=member_info["name"],
                    role=member_info["role"],
                    personality=member_info["personality"],
                    analysis="Error during analysis",
                    vote="CONSIDER",
                    confidence=0.0,
                    reasoning=f"Error: {str(e)}"
                )

        # Get all committee member analyses in parallel
        tasks = [
            get_committee_member_analysis(member_id, member_info)
            for member_id, member_info in COMMITTEE_MEMBERS.items()
        ]

        committee_members = await asyncio.gather(*tasks)

        # Calculate consensus
        votes = [member.vote for member in committee_members]
        vote_counts = {"STRONG_INVEST": votes.count("STRONG_INVEST"), "CONSIDER": votes.count("CONSIDER"), "HIGH_RISK": votes.count("HIGH_RISK"), "PASS": votes.count("PASS")}

        # Determine majority vote
        majority_vote = max(vote_counts, key=vote_counts.get)

        # Calculate consensus score (0-1, where 1 = unanimous)
        total_votes = len(votes)
        consensus_score = vote_counts[majority_vote] / total_votes if total_votes > 0 else 0

        # Determine final verdict based on majority and consensus
        if consensus_score >= 0.75:  # Strong consensus
            final_verdict = majority_vote
        elif majority_vote == "PASS" and consensus_score >= 0.5:
            final_verdict = "PASS"
        else:
            final_verdict = "CONSIDER"  # Need more discussion

        # Find dissenting opinions
        dissenting_opinions = [
            f"{member.name} ({member.role}): {member.reasoning[:100]}..."
            for member in committee_members
            if member.vote != majority_vote
        ]

        # Extract key debate points with better formatting
        key_debate_points = []

        # Add market vs risk perspective debate
        invest_votes = [m for m in committee_members if m.vote in ["STRONG_INVEST", "CONSIDER"]]
        pass_votes = [m for m in committee_members if m.vote in ["HIGH_RISK", "PASS"]]

        if invest_votes and pass_votes:
            key_debate_points.append("💰 Market opportunity vs ⚠️ execution risks - committee split on growth potential vs practical challenges")
        elif len(set(votes)) > 1:
            key_debate_points.append("🤝 Mixed committee opinions require further due diligence and validation")

        # Add specific concerns if any member has low confidence
        low_confidence_members = [m for m in committee_members if m.confidence < 40]
        if low_confidence_members:
            concerns = [f"⚠️ {m.name}: {m.analysis[:80]}..." for m in low_confidence_members]
            key_debate_points.extend(concerns)

        # Add high confidence analysis points
        high_confidence_members = [m for m in committee_members if m.confidence >= 70]
        if high_confidence_members:
            strengths = [f"✅ {m.name}: {m.analysis[:80]}..." for m in high_confidence_members[:2]]
            key_debate_points.extend(strengths)

        # Create a comprehensive summary
        summary_reasons = []
        if final_verdict == "STRONG_INVEST":
            summary_reasons.append("🚀 Strong consensus on exceptional market opportunity with multiple positive indicators")
        elif final_verdict == "CONSIDER":
            summary_reasons.append("⚖️ Balanced view with potential but requiring additional validation and due diligence")
        elif final_verdict == "HIGH_RISK":
            summary_reasons.append("⚠️ Significant concerns identified but committee sees some potential worth exploring")
        else:  # PASS
            summary_reasons.append("❌ Major red flags outweigh potential benefits - not recommended for investment")

        # Add confidence explanation
        if consensus_score >= 0.75:
            summary_reasons.append(f"🎯 High confidence ({consensus_score*100:.0f}%) based on strong committee alignment")
        elif consensus_score >= 0.5:
            summary_reasons.append(f"⚖️ Moderate confidence ({consensus_score*100:.0f}%) with some dissenting views")
        else:
            summary_reasons.append(f"🤔 Low confidence ({consensus_score*100:.0f}%) - committee needs more discussion")

        return InvestmentCommitteeResponse(
            deal_pitch=deal_request.pitch,
            committee_members=committee_members,
            final_verdict=final_verdict,
            consensus_score=consensus_score,
            majority_vote=majority_vote,
            dissenting_opinions=dissenting_opinions,
            key_debate_points=key_debate_points
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
