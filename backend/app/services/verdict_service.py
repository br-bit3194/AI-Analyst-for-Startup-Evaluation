from typing import Dict, Any, Optional, List, Tuple
import logging
from datetime import datetime
from ..models.verdict import InvestmentVerdict, VerdictType
from ..utils.agent_logger import AgentLogger

class VerdictService:
    def __init__(self):
        self.logger = AgentLogger("verdict_service")
    
    def _calculate_weighted_score(self, analysis_data: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
        """Calculate a weighted score based on various factors.
        
        Returns:
            Tuple of (weighted_score, component_scores)
        """
        # Define weights for each component (sum to 1.0)
        weights = {
            'market_analysis': 0.30,  # Market size, growth, competition
            'team_analysis': 0.25,    # Team experience, track record
            'financial_analysis': 0.25, # Revenue, margins, burn rate
            'product_analysis': 0.10,  # Product differentiation, tech advantage
            'traction_metrics': 0.10   # Customer growth, engagement
        }
        
        component_scores = {}
        weighted_sum = 0.0
        
        # Calculate weighted score for each component
        for component, weight in weights.items():
            # Get score from analysis data, default to 0 if not present
            score = analysis_data.get(component, {}).get('score', 0)
            component_scores[component] = score
            weighted_sum += score * weight
        
        # Apply adjustment factors
        adjustments = self._calculate_adjustments(analysis_data, component_scores)
        adjusted_score = min(10, max(0, weighted_sum + adjustments))
        
        return adjusted_score, component_scores
    
    def _calculate_adjustments(self, analysis_data: Dict[str, Any], component_scores: Dict[str, float]) -> float:
        """Calculate adjustments to the base score based on additional factors."""
        adjustments = 0.0
        
        # Market leadership bonus (up to +1.0)
        if analysis_data.get('market_analysis', {}).get('is_leader', False):
            adjustments += 1.0
            
        # Strong IP/patents (up to +0.5)
        if analysis_data.get('product_analysis', {}).get('has_strong_ip', False):
            adjustments += 0.5
            
        # Positive unit economics (up to +0.5)
        financials = analysis_data.get('financial_analysis', {})
        if financials.get('unit_economics', {}).get('is_positive', False):
            adjustments += 0.5
            
        # High burn rate penalty (up to -1.0)
        if financials.get('burn_rate_months', 0) < 6:  # Less than 6 months of runway
            adjustments -= 1.0
            
        return adjustments
    
    def _determine_recommendation(self, score: float) -> Tuple[VerdictType, float]:
        """Determine the recommendation and confidence based on the score."""
        if score >= 8.0:
            return VerdictType.INVEST, min(100, 70 + (score - 8) * 15)  # 70-100%
        elif score >= 6.0:
            return VerdictType.CONSIDER, min(90, 30 + (score - 6) * 20)  # 30-90%
        else:
            return VerdictType.PASS, min(100, 20 + (6 - score) * 16)  # 20-100%
    
    def _generate_key_metrics(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract key metrics from the analysis data."""
        return {
            'market_size': analysis_data.get('market_analysis', {}).get('market_size'),
            'growth_rate': analysis_data.get('market_analysis', {}).get('growth_rate'),
            'revenue': analysis_data.get('financial_analysis', {}).get('revenue'),
            'mrr_growth': analysis_data.get('traction_metrics', {}).get('mrr_growth'),
            'customer_acquisition_cost': analysis_data.get('financial_analysis', {}).get('cac'),
            'lifetime_value': analysis_data.get('financial_analysis', {}).get('ltv'),
            'burn_rate': analysis_data.get('financial_analysis', {}).get('burn_rate_months'),
            'team_size': analysis_data.get('team_analysis', {}).get('team_size')
        }
    
    def _generate_risk_factors(self, analysis_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Identify key risk factors from the analysis data."""
        risks = []
        
        # Market risks
        market = analysis_data.get('market_analysis', {})
        if market.get('competition_level') == 'high':
            risks.append({'factor': 'High competition', 'severity': 'medium'})
            
        # Financial risks
        financials = analysis_data.get('financial_analysis', {})
        if financials.get('burn_rate_months', 0) < 6:
            risks.append({'factor': 'Low cash runway', 'severity': 'high'})
            
        # Team risks
        team = analysis_data.get('team_analysis', {})
        if team.get('has_management_gaps', False):
            risks.append({'factor': 'Management gaps', 'severity': 'high'})
            
        # Product risks
        product = analysis_data.get('product_analysis', {})
        if not product.get('has_mvp', False):
            risks.append({'factor': 'No MVP yet', 'severity': 'medium'})
            
        return risks
    
    def _generate_next_steps(self, recommendation: VerdictType) -> List[str]:
        """Generate recommended next steps based on the verdict."""
        if recommendation == VerdictType.INVEST:
            return [
                "Proceed with due diligence",
                "Review investment terms",
                "Schedule meeting with founders"
            ]
        elif recommendation == VerdictType.CONSIDER:
            return [
                "Request additional information",
                "Conduct customer references",
                "Review competitive landscape"
            ]
        else:  # PASS
            return [
                "Document decision rationale",
                "Provide feedback to founders",
                "Consider revisiting in 6-12 months"
            ]
    
    async def generate_verdict(self, analysis_data: Dict[str, Any]) -> InvestmentVerdict:
        """
        Generate an investment verdict based on the analysis data.
        
        Args:
            analysis_data: The complete analysis data including market, team, financials, etc.
            
        Returns:
            InvestmentVerdict: The generated verdict with recommendation and confidence
        """
        self.logger.info("Generating investment verdict")
        
        try:
            # Calculate weighted score and get component scores
            weighted_score, component_scores = self._calculate_weighted_score(analysis_data)
            
            # Determine recommendation and confidence
            recommendation, confidence = self._determine_recommendation(weighted_score)
            
            # Generate summary and rationale
            summary, rationale = self._generate_summary(
                recommendation=recommendation,
                market_score=component_scores.get('market_analysis', 0),
                team_score=component_scores.get('team_analysis', 0),
                financials_score=component_scores.get('financial_analysis', 0)
            )
            
            # Generate additional components
            key_metrics = self._generate_key_metrics(analysis_data)
            risk_factors = self._generate_risk_factors(analysis_data)
            next_steps = self._generate_next_steps(recommendation)
            
            verdict = InvestmentVerdict(
                recommendation=recommendation,
                confidence=confidence,
                summary=summary,
                rationale=rationale,
                key_metrics=key_metrics,
                risk_factors=risk_factors,
                next_steps=next_steps
            )
            
            self.logger.info(
                f"Generated verdict: {verdict.recommendation} with {verdict.confidence}% confidence",
                {"verdict": verdict.dict()}
            )
            
            return verdict
            
        except Exception as e:
            self.logger.error(f"Error generating verdict: {str(e)}", exc_info=True)
            # Return a neutral verdict in case of errors
            return InvestmentVerdict(
                recommendation=VerdictType.CONSIDER,
                confidence=50.0,
                summary="Unable to generate verdict due to an error",
                rationale="An error occurred while processing the investment analysis."
            )
    
    def _generate_summary(
        self,
        recommendation: VerdictType,
        market_score: float,
        team_score: float,
        financials_score: float
    ) -> tuple[str, str]:
        """Generate a concise summary and rationale for the verdict."""
        strengths = []
        weaknesses = []
        
        # Analyze market
        if market_score >= 8:
            strengths.append("exceptional market potential")
        elif market_score >= 6:
            strengths.append("promising market")
        elif market_score <= 4:
            weaknesses.append("challenging market conditions")
        elif market_score <= 2:
            weaknesses.append("highly competitive or shrinking market")
            
        # Analyze team
        if team_score >= 8:
            strengths.append("exceptional founding team")
        elif team_score >= 6:
            strengths.append("experienced team")
        elif team_score <= 4:
            weaknesses.append("team-related concerns")
        elif team_score <= 2:
            weaknesses.append("significant team gaps")
            
        # Analyze financials
        if financials_score >= 8:
            strengths.append("exceptional financials")
        elif financials_score >= 6:
            strengths.append("solid financials")
        elif financials_score <= 4:
            weaknesses.append("financial concerns")
        elif financials_score <= 2:
            weaknesses.append("serious financial risks")
        
        # Generate summary based on recommendation
        if recommendation == VerdictType.INVEST:
            if strengths:
                summary = f"Strong investment opportunity with {', '.join(strengths[:2])}."
            else:
                summary = "Favorable investment opportunity based on comprehensive analysis."
                
            rationale = (
                f"The company demonstrates compelling investment potential with {', '.join(strengths)}. "
                "The combination of these factors, along with a clear path to growth and profitability, "
                "makes this a highly attractive investment opportunity."
            )
            
        elif recommendation == VerdictType.CONSIDER:
            if strengths and weaknesses:
                summary = f"Consider with caution: {strengths[0]} but {weaknesses[0]}."
                rationale = (
                    f"The company shows potential with {strengths[0]}, but {weaknesses[0]} require careful consideration. "
                    "Further due diligence is recommended to validate key assumptions and mitigate risks."
                )
            else:
                summary = "Neutral potential with balanced considerations."
                rationale = (
                    "The analysis reveals a balanced profile with both positive and negative aspects. "
                    "The opportunity may warrant further investigation to better understand the risk-reward profile."
                )
                
        else:  # PASS
            if weaknesses:
                summary = f"Not recommended due to {weaknesses[0]}."
                rationale = (
                    f"The analysis indicates {weaknesses[0]}, which significantly impacts the investment potential. "
                    "At this time, the risks appear to outweigh the potential rewards. "
                    "It may be prudent to reconsider if there are material changes to the business fundamentals."
                )
            else:
                summary = "Not recommended based on current analysis."
                rationale = (
                    "After careful evaluation, the investment opportunity does not meet our investment criteria. "
                    "The current risk-reward profile is not sufficiently compelling to proceed."
                )
            
        return summary, rationale
