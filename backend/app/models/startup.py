from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class WebsiteAnalysis(BaseModel):
    """Model for storing website analysis results."""
    url: str
    status: str = Field(..., description="Analysis status (e.g., 'completed', 'failed')")
    domain: Optional[str] = None
    content_length: Optional[int] = None
    content_preview: Optional[str] = None
    store_id: Optional[str] = None
    error: Optional[str] = None
    processed_at: datetime = Field(default_factory=datetime.utcnow)

class PitchAnalysis(BaseModel):
    """Model for storing pitch analysis results."""
    content: str
    length: int
    word_count: int
    source: Optional[str] = None
    processed_at: datetime = Field(default_factory=datetime.utcnow)

class CombinedAnalysis(BaseModel):
    """Model for combined analysis results."""
    summary: str
    has_website_data: bool
    confidence: Optional[float] = None
    processed_at: datetime = Field(default_factory=datetime.utcnow)

class StartupAnalysis(BaseModel):
    """Main model for startup analysis results."""
    analysis_id: str = Field(..., description="Unique identifier for this analysis")
    status: str = Field(..., description="Analysis status (e.g., 'completed', 'processing', 'error')")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Core analysis components
    pitch_analysis: PitchAnalysis
    website_analysis: Optional[WebsiteAnalysis] = None
    combined_analysis: CombinedAnalysis
    
    # Metadata
    source: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
        json_schema_extra = {
            "example": {
                "analysis_id": "analysis_123",
                "status": "completed",
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-01T00:00:00Z",
                "pitch_analysis": {
                    "content": "Startup pitch text...",
                    "length": 100,
                    "word_count": 20,
                    "source": "api",
                    "processed_at": "2023-01-01T00:00:00Z"
                },
                "website_analysis": {
                    "url": "https://example.com",
                    "status": "completed",
                    "domain": "example.com",
                    "content_length": 5000,
                    "content_preview": "Example startup website content...",
                    "store_id": "store_123",
                    "processed_at": "2023-01-01T00:00:00Z"
                },
                "combined_analysis": {
                    "summary": "Combined analysis of pitch and website...",
                    "has_website_data": True,
                    "confidence": 0.85,
                    "processed_at": "2023-01-01T00:00:00Z"
                },
                "source": "api",
                "tags": ["saas", "ai"],
                "metadata": {}
            }
        }

class AgentContext(BaseModel):
    """Model for agent context information."""
    startup_id: str
    agent_role: str
    query: str
    enhanced_query: str
    relevant_chunks: List[Dict[str, Any]] = Field(default_factory=list)
    analysis: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
