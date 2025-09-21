from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime
import random

from ..services.verdict_service import VerdictService
from ..models.verdict import InvestmentVerdict, VerdictType
from ..utils.agent_logger import AgentLogger

router = APIRouter(prefix="/api/verdict", tags=["verdict"])
logger = AgentLogger("verdict_router")

# Request/Response Models
class AnalysisData(BaseModel):
    """Analysis data model for verdict generation."""
    market_analysis: Dict[str, Any] = Field(
        ...,
        description="Market analysis data including size, growth, competition, etc."
    )
    team_analysis: Dict[str, Any] = Field(
        ...,
        description="Team analysis including experience, track record, etc."
    )
    financial_analysis: Dict[str, Any] = Field(
        ...,
        description="Financial analysis including revenue, margins, burn rate, etc."
    )
    product_analysis: Optional[Dict[str, Any]] = Field(
        None,
        description="Product analysis including differentiation, tech stack, etc."
    )
    traction_metrics: Optional[Dict[str, Any]] = Field(
        None,
        description="Traction metrics including user growth, engagement, etc."
    )
    
    @model_validator(mode='after')
    def validate_required_sections(self) -> 'AnalysisData':
        for field_name in ['market_analysis', 'team_analysis', 'financial_analysis']:
            value = getattr(self, field_name)
            if not value:
                raise ValueError(f"{field_name} is required")
            if 'score' not in value:
                raise ValueError(f"score is required in {field_name}")
        return self

@router.post("/generate", 
             response_model=InvestmentVerdict,
             status_code=status.HTTP_200_OK,
             summary="Generate Investment Verdict",
             description="""
             Generate an investment verdict based on comprehensive analysis data.
             
             The analysis data should include detailed assessments of the market, team, 
             financials, product, and traction metrics.
             """)
async def generate_verdict(analysis_data: AnalysisData):
    """
    Generate an investment verdict based on the provided analysis data.
    
    Args:
        analysis_data: Comprehensive analysis data including market, team, 
                     financials, product, and traction metrics.
                     
    Returns:
        InvestmentVerdict: The generated verdict with recommendation, confidence,
                         and detailed rationale.
    """
    logger.info("Received request to generate investment verdict")
    
    try:
        # Convert Pydantic model to dict for service
        analysis_dict = analysis_data.dict(exclude_none=True)
        
        # Initialize the verdict service
        service = VerdictService()
        
        # Generate the verdict
        verdict = await service.generate_verdict(analysis_dict)
        
        logger.info(
            f"Successfully generated verdict: {verdict.recommendation}",
            {"verdict": verdict.dict()}
        )
        
        return verdict
        
    except ValueError as e:
        logger.warning(f"Invalid request data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "Invalid request data", "message": str(e)}
        )
    except Exception as e:
        logger.error(f"Error generating verdict: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to generate verdict", "message": str(e)}
        )

@router.get("/example", 
            response_model=InvestmentVerdict,
            summary="Get Example Verdict",
            description="""
            Get a realistic example investment verdict for demonstration purposes.
            This generates a randomized but realistic verdict based on sample data.
            """)
async def get_example_verdict():
    """
    Get a realistic example investment verdict for demonstration purposes.
    """
    try:
        # Generate a realistic example with randomized but plausible values
        import random
        from datetime import datetime, timedelta
        
        # Randomly select a recommendation type
        rec_type = random.choice(list(VerdictType))
        
        # Generate confidence based on recommendation type
        if rec_type == VerdictType.INVEST:
            confidence = random.uniform(75.0, 95.0)
            market_size = f"${random.randint(10, 100)}B"
            growth_rate = f"{random.randint(15, 50)}% YoY"
            revenue = f"${random.randint(1, 20)}M"
            mrr_growth = f"{random.randint(10, 30)}% MoM"
            team_size = random.randint(10, 50)
            
            summary = "Strong investment opportunity with significant market potential and experienced team."
            rationale = (
                "The company operates in a large and growing market with limited competition. "
                "The founding team has relevant industry experience and a track record of success. "
                f"With {revenue} in annual recurring revenue and {mrr_growth} month-over-month growth, "
                "the company is well-positioned for scale. The unit economics are attractive with "
                "a clear path to profitability in the next 18-24 months."
            )
            
        elif rec_type == VerdictType.CONSIDER:
            confidence = random.uniform(40.0, 74.9)
            market_size = f"${random.randint(1, 20)}B"
            growth_rate = f"{random.randint(5, 25)}% YoY"
            revenue = f"${random.randint(0.5, 5)}M"
            mrr_growth = f"{random.randint(0, 15)}% MoM"
            team_size = random.randint(5, 30)
            
            summary = "Promising opportunity with some risks that require further investigation."
            rationale = (
                "The company shows potential in a moderately competitive market. "
                "While the team has relevant experience, there are some gaps in the management team. "
                f"Revenue of {revenue} with {mrr_growth} MoM growth is promising but not yet at scale. "
                "Additional due diligence is recommended to validate market size assumptions and unit economics."
            )
            
        else:  # PASS
            confidence = random.uniform(20.0, 59.9)
            market_size = f"${random.randint(0.1, 5)}B"
            growth_rate = f"{random.randint(-5, 15)}% YoY"
            revenue = f"${random.randint(0.1, 2)}M"
            mrr_growth = f"{random.randint(-5, 10)}% MoM"
            team_size = random.randint(2, 15)
            
            summary = "Not recommended due to significant market and execution risks."
            rationale = (
                "The company operates in a highly competitive market with limited differentiation. "
                "The team, while passionate, lacks relevant industry experience. "
                f"With only {revenue} in revenue and {mrr_growth} MoM growth, the business model "
                "has not yet been validated. The high burn rate and limited runway present "
                "significant financial risks."
            )
        
        # Generate risk factors based on recommendation type
        risk_factors = []
        if rec_type == VerdictType.INVEST:
            risk_factors = [
                {"factor": "Market competition", "severity": "low"},
                {"factor": "Customer concentration", "severity": "medium"}
            ]
        elif rec_type == VerdictType.CONSIDER:
            risk_factors = [
                {"factor": "Management team gaps", "severity": "medium"},
                {"factor": "Unproven unit economics", "severity": "high"},
                {"factor": "Customer acquisition costs", "severity": "medium"}
            ]
        else:
            risk_factors = [
                {"factor": "Limited market opportunity", "severity": "high"},
                {"factor": "Unproven business model", "severity": "high"},
                {"factor": "High burn rate", "severity": "critical"},
                {"factor": "Inexperienced team", "severity": "high"}
            ]
        
        # Generate next steps
        next_steps = [
            "Review detailed financial projections",
            "Conduct customer reference calls",
            "Validate market size assumptions"
        ]
        
        # Create the example verdict
        example = {
            "recommendation": rec_type,
            "confidence": round(confidence, 1),
            "summary": summary,
            "rationale": rationale,
            "key_metrics": {
                "market_size": market_size,
                "growth_rate": growth_rate,
                "revenue": revenue,
                "mrr_growth": mrr_growth,
                "team_size": team_size,
                "last_updated": datetime.utcnow().isoformat()
            },
            "risk_factors": risk_factors,
            "next_steps": next_steps
        }
        
        # Validate against the model
        return InvestmentVerdict(**example)
        
    except Exception as e:
        logger.error(f"Error generating example verdict: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to generate example verdict", "message": str(e)}
        )
