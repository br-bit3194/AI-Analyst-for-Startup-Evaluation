from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class AnalysisInput(BaseModel):
    pitch: str
    website_url: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = {}

class CommitteeMember(BaseModel):
    name: str
    role: str
    comment: str
    sentiment: str  # positive, negative, neutral

class AnalysisResult(BaseModel):
    business_overview: Optional[str] = None
    market_opportunity: Optional[str] = None
    team_analysis: Optional[str] = None
    market_analysis: Optional[str] = None
    financial_analysis: Optional[str] = None
    risks: Optional[List[str]] = None

class AnalysisSummary(BaseModel):
    verdict: str
    confidence: float
    key_highlights: List[str]
    recommendations: List[str]

class AnalysisHistory(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str  # processing, completed, failed
    input: AnalysisInput
    analysis: Optional[AnalysisResult] = None
    committee_debate: Optional[List[CommitteeMember]] = None
    summary: Optional[AnalysisSummary] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "user_id": "user123",
                "status": "completed",
                "input": {
                    "pitch": "Sample pitch text...",
                    "website_url": "https://example.com",
                    "additional_context": {}
                },
                "analysis": {
                    "business_overview": "Business overview...",
                    "market_opportunity": "Market opportunity...",
                    "team_analysis": "Team analysis...",
                    "market_analysis": "Market analysis...",
                    "financial_analysis": "Financial analysis...",
                    "risks": ["Risk 1", "Risk 2"]
                },
                "committee_debate": [
                    {
                        "name": "John Doe",
                        "role": "VC Partner",
                        "comment": "I believe this is a strong investment...",
                        "sentiment": "positive"
                    }
                ],
                "summary": {
                    "verdict": "STRONG_INVEST",
                    "confidence": 0.85,
                    "key_highlights": ["Strong team", "Large market"],
                    "recommendations": ["Recommend investment", "Follow up with team"]
                }
            }
        }
