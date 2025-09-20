from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, validator
from app.models import DocumentModel
from app.services.llm_client import call_llm
from datetime import date

router = APIRouter(prefix="/finance", tags=["finance"])

class TimePeriod(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class MetricPoint(BaseModel):
    period: str  # e.g., "2025-01" or "Q1-2025" or "2025"
    value: float
    growth_rate: Optional[float] = None  # MoM, QoQ, or YoY growth

class FinancialHealth(BaseModel):
    mrr: List[MetricPoint] = Field(default_factory=list, description="Monthly Recurring Revenue")
    arr: Optional[float] = Field(None, description="Annual Recurring Revenue")
    burn_rate: List[MetricPoint] = Field(default_factory=list, description="Monthly net burn rate")
    gross_margin: List[MetricPoint] = Field(default_factory=list, description="Gross margin percentage")
    runway_months: Optional[float] = Field(None, description="Estimated runway in months")
    cash_balance: Optional[float] = Field(None, description="Current cash balance")
    
class CashFlow(BaseModel):
    operating_activities: List[MetricPoint] = Field(default_factory=list, description="Cash from operations")
    investing_activities: List[MetricPoint] = Field(default_factory=list, description="Cash from investing")
    financing_activities: List[MetricPoint] = Field(default_factory=list, description="Cash from financing")
    free_cash_flow: List[MetricPoint] = Field(default_factory=list, description="Free cash flow")

class UnitEconomics(BaseModel):
    cac: Optional[float] = Field(None, description="Customer Acquisition Cost")
    ltv: Optional[float] = Field(None, description="Lifetime Value")
    payback_period: Optional[float] = Field(None, description="Payback period in months")
    ltv_to_cac_ratio: Optional[float] = Field(None, description="LTV:CAC ratio")
    churn_rate: Optional[float] = Field(None, description="Monthly customer churn rate")
    arpa: Optional[float] = Field(None, description="Average Revenue Per Account")

class BenchmarkComparison(BaseModel):
    metric: str
    startup_value: float
    industry_avg: float
    percentile: float  # 0-100
    period: str

class FinanceMetrics(BaseModel):
    health: FinancialHealth
    cash_flow: CashFlow
    unit_economics: UnitEconomics
    benchmarks: List[BenchmarkComparison] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

FINANCIAL_SYSTEM_PROMPT = """You are a senior financial analyst with expertise in startup metrics and valuation. 
Extract and analyze financial data with the following guidelines:
1. Be precise with numbers and dates
2. Calculate derived metrics (e.g., growth rates, ratios)
3. Flag any inconsistencies or unusual patterns
4. Return a comprehensive JSON response with all available financial data
5. Include confidence scores for extracted metrics
"""

FINANCIAL_EXTRACTION_TEMPLATE = """Analyze the following startup financial information and extract all available metrics.

For time-series data, include:
- At least 6 months of historical data if available
- Growth rates between periods
- Any visible trends or anomalies

For unit economics, calculate:
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Payback period
- LTV:CAC ratio
- Churn rate
- ARPA (Average Revenue Per Account)

For cash flow, identify:
- Operating activities
- Investing activities
- Financing activities
- Free cash flow

Return a JSON object with this structure:
{{
  "health": {{
    "mrr": [{{"period": "YYYY-MM", "value": number, "growth_rate": number}}],
    "arr": number,
    "burn_rate": [{{"period": "YYYY-MM", "value": number, "growth_rate": number}}],
    "gross_margin": [{{"period": "YYYY-MM", "value": number, "growth_rate": number}}],
    "runway_months": number,
    "cash_balance": number
  }},
  "cash_flow": {{
    "operating_activities": [{{"period": "YYYY-MM", "value": number}}],
    "investing_activities": [{{"period": "YYYY-MM", "value": number}}],
    "financing_activities": [{{"period": "YYYY-MM", "value": number}}],
    "free_cash_flow": [{{"period": "YYYY-MM", "value": number}}]
  }},
  "unit_economics": {{
    "cac": number,
    "ltv": number,
    "payback_period": number,
    "ltv_to_cac_ratio": number,
    "churn_rate": number,
    "arpa": number
  }},
  "confidence_scores": {{
    "overall_confidence": 0.0-1.0,
    "data_completeness": 0.0-1.0,
    "data_consistency": 0.0-1.0
  }},
  "anomalies": ["list of any unusual findings"],
  "notes": "Any additional observations"
}}

Document Content:
{doc_text}"""

@router.get("/metrics/{document_id}", response_model=FinanceMetrics)
async def get_finance_metrics(
    document_id: str,
    period: TimePeriod = Query(TimePeriod.MONTHLY, description="Aggregation period for metrics"),
    include_benchmarks: bool = Query(False, description="Include industry benchmark comparisons")
):
    """
    Extract and analyze financial metrics from a document.
    
    This endpoint processes the document text to extract financial metrics,
    calculate derived metrics, and optionally compare against industry benchmarks.
    """
    # Get document from database
    doc = await DocumentModel.get(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.extracted_text:
        raise HTTPException(status_code=400, detail="Document not processed or no text extracted")

    # Prepare and send to LLM for analysis
    user_prompt = FINANCIAL_EXTRACTION_TEMPLATE.format(
        doc_text=doc.extracted_text[:12000]  # Limit context window
    )
    
    try:
        # Use Gemini 2.5 Pro for better financial analysis
        raw_response = await call_llm(
            FINANCIAL_SYSTEM_PROMPT,
            user_prompt,
            model="gemini-2.5-pro"  # Using Pro model for better analysis
        )
        
        # Parse and validate response
        data = parse_and_validate_financial_data(raw_response)
        
        # Add benchmark data if requested
        if include_benchmarks:
            data["benchmarks"] = await get_benchmark_comparisons(data)
            
        return FinanceMetrics(**data)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing financial data: {str(e)}"
        )

def parse_and_validate_financial_data(raw_response: str) -> Dict[str, Any]:
    """Parse LLM response and validate financial data structure."""
    import json
    from datetime import datetime
    
    try:
        data = json.loads(raw_response)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        import re
        json_match = re.search(r'```(?:json)?\n(.*?)\n```', raw_response, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(1))
        else:
            # Fallback to minimal structure with error in notes
            return create_minimal_finance_metrics(
                f"Could not parse LLM response: {raw_response[:500]}"
            )
    
    # Basic validation and normalization
    if not isinstance(data, dict):
        return create_minimal_finance_metrics("Invalid data format from LLM")
    
    # Ensure all required top-level keys exist
    result = {
        "health": data.get("health", {}),
        "cash_flow": data.get("cash_flow", {}),
        "unit_economics": data.get("unit_economics", {}),
        "confidence_scores": data.get("confidence_scores", {
            "overall_confidence": 0.0,
            "data_completeness": 0.0,
            "data_consistency": 0.0
        }),
        "anomalies": data.get("anomalies", []),
        "notes": data.get("notes", "")
    }
    
    return result

def create_minimal_finance_metrics(notes: str) -> Dict[str, Any]:
    """Create a minimal valid finance metrics structure with error notes."""
    return {
        "health": {
            "mrr": [],
            "burn_rate": [],
            "gross_margin": [],
            "runway_months": None,
            "cash_balance": None,
            "arr": None
        },
        "cash_flow": {
            "operating_activities": [],
            "investing_activities": [],
            "financing_activities": [],
            "free_cash_flow": []
        },
        "unit_economics": {
            "cac": None,
            "ltv": None,
            "payback_period": None,
            "ltv_to_cac_ratio": None,
            "churn_rate": None,
            "arpa": None
        },
        "confidence_scores": {
            "overall_confidence": 0.0,
            "data_completeness": 0.0,
            "data_consistency": 0.0
        },
        "anomalies": ["Incomplete or invalid financial data"],
        "notes": notes
    }

async def get_benchmark_comparisons(metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Get industry benchmark comparisons for the given metrics.
    
    This is a placeholder that would typically query a benchmark database.
    In a real implementation, this would connect to BigQuery or another data source.
    """
    # TODO: Implement actual benchmark lookup
    return []

@router.get("/health/{document_id}", response_model=FinancialHealth)
async def get_financial_health(document_id: str):
    """Get financial health metrics for a document."""
    metrics = await get_finance_metrics(document_id, include_benchmarks=False)
    return metrics.health

@router.get("/cash-flow/{document_id}", response_model=CashFlow)
async def get_cash_flow(document_id: str):
    """Get cash flow metrics for a document."""
    metrics = await get_finance_metrics(document_id, include_benchmarks=False)
    return metrics.cash_flow

@router.get("/unit-economics/{document_id}", response_model=UnitEconomics)
async def get_unit_economics(document_id: str):
    """Get unit economics metrics for a document."""
    metrics = await get_finance_metrics(document_id, include_benchmarks=False)
    return metrics.unit_economics

@router.get("/benchmarks/{document_id}", response_model=List[BenchmarkComparison])
async def get_benchmarks(document_id: str):
    """Get benchmark comparisons for a document."""
    metrics = await get_finance_metrics(document_id, include_benchmarks=True)
    return metrics.benchmarks
