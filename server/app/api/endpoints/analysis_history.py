from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter()

# Mock data for demonstration
MOCK_ANALYSES = [
    {
        "id": "analysis_1",
        "title": "E-commerce Platform Analysis",
        "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "status": "completed",
        "type": "pitch",
        "summary": "Analysis of the e-commerce platform pitch focusing on market potential and technical feasibility.",
        "metadata": {
            "wordCount": 1245
        }
    },
    {
        "id": "analysis_2",
        "title": "Financial Report Q2 2023",
        "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat(),
        "status": "completed",
        "type": "document",
        "metadata": {
            "fileName": "financial_report_q2_2023.pdf"
        }
    },
    {
        "id": "analysis_3",
        "title": "Startup Website Analysis",
        "timestamp": (datetime.utcnow() - timedelta(days=3)).isoformat(),
        "status": "completed",
        "type": "website",
        "metadata": {
            "url": "https://example-startup.com"
        }
    },
]

@router.get("/history")
async def get_analysis_history(
    limit: int = 10,
    offset: int = 0
):
    """
    Get a list of past analyses with pagination support.
    
    Args:
        limit: Maximum number of items to return
        offset: Number of items to skip
        
    Returns:
        List of analysis items with pagination metadata
    """
    try:
        # In a real implementation, this would query the database
        # For now, we'll return mock data
        total = len(MOCK_ANALYSES)
        items = MOCK_ANALYSES[offset:offset + limit]
        
        return {
            "items": items,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch analysis history: {str(e)}"
        )

@router.get("/{analysis_id}")
async def get_analysis_details(analysis_id: str):
    """
    Get detailed information about a specific analysis.
    
    Args:
        analysis_id: The ID of the analysis to retrieve
        
    Returns:
        Detailed analysis information
    """
    try:
        # In a real implementation, this would query the database
        # For now, we'll return mock data
        analysis = next(
            (a for a in MOCK_ANALYSES if a["id"] == analysis_id), 
            None
        )
        
        if not analysis:
            raise HTTPException(
                status_code=404,
                detail=f"Analysis with ID {analysis_id} not found"
            )
            
        # Add more detailed mock data
        if analysis["type"] == "pitch":
            analysis["details"] = {
                "sections": [
                    {"title": "Market Analysis", "content": "Detailed market analysis..."},
                    {"title": "Financial Projections", "content": "5-year financial projections..."},
                    {"title": "Team Evaluation", "content": "Assessment of the founding team..."}
                ],
                "metrics": {
                    "marketScore": random.randint(70, 95),
                    "teamScore": random.randint(60, 90),
                    "financialScore": random.randint(50, 85)
                }
            }
        elif analysis["type"] == "document":
            analysis["details"] = {
                "extractedText": "Full extracted text from the document...",
                "keyMetrics": {
                    "revenue": f"${random.randint(100, 1000)}K",
                    "growthRate": f"{random.randint(10, 50)}% YoY",
                    "mrr": f"${random.randint(10, 100)}K"
                }
            }
        elif analysis["type"] == "website":
            analysis["details"] = {
                "screenshotUrl": "https://via.placeholder.com/800x600",
                "seoScore": random.randint(50, 95),
                "mobileFriendly": random.choice([True, False]),
                "technologies": ["React", "Node.js", "MongoDB", "AWS"]
            }
            
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch analysis details: {str(e)}"
        )
