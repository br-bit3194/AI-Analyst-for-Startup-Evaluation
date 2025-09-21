from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator, model_validator

class VerdictType(str, Enum):
    INVEST = "INVEST"
    CONSIDER = "CONSIDER"
    PASS = "PASS"

class InvestmentVerdict(BaseModel):
    """
    The final investment recommendation with confidence and reasoning.
    """
    recommendation: VerdictType = Field(
        ...,
        description="The investment recommendation (INVEST/CONSIDER/PASS)"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Confidence score from 0 to 100"
    )
    summary: str = Field(
        ...,
        max_length=200,
        description="Concise one-sentence summary of the verdict"
    )
    rationale: str = Field(
        ...,
        description="Detailed rationale behind the verdict"
    )
    key_metrics: Optional[Dict[str, Any]] = Field(
        None,
        description="Key metrics that influenced the verdict"
    )
    risk_factors: Optional[List[Dict[str, str]]] = Field(
        None,
        description="List of risk factors with their severity"
    )
    next_steps: Optional[List[str]] = Field(
        None,
        description="Recommended next steps based on the verdict"
    )

    @validator('confidence')
    def round_confidence(cls, v):
        return round(v, 1)

    @property
    def confidence_color(self) -> str:
        """Get color based on confidence level"""
        if self.confidence >= 80:
            return "success"
        elif self.confidence >= 50:
            return "warning"
        return "danger"
    
    @property
    def recommendation_color(self) -> str:
        """Get color based on recommendation type"""
        return {
            VerdictType.INVEST: "success",
            VerdictType.CONSIDER: "warning",
            VerdictType.PASS: "danger"
        }[self.recommendation]

    @model_validator(mode='before')
    @classmethod
    def validate_summary_length(cls, data):
        if isinstance(data, dict):
            summary = data.get('summary', '')
            if summary and len(summary) > 200:
                data['summary'] = summary[:197] + '...'
        return data
        
    def to_dict(self):
        """Convert to frontend-friendly format"""
        result = {
            "recommendation": self.recommendation.value,
            "recommendation_label": self.recommendation.value.capitalize(),
            "recommendation_color": self.recommendation_color,
            "confidence": self.confidence,
            "confidence_color": self.confidence_color,
            "summary": self.summary,
            "rationale": self.rationale,
            "key_metrics": self.key_metrics or {},
            "risk_factors": self.risk_factors or [],
            "next_steps": self.next_steps or []
        }
        return result
