import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import json

from app.main import app
from app.services.agent_context_service import AgentContextService
from app.models.startup import AgentContext, WebsiteAnalysis, PitchAnalysis, CombinedAnalysis

client = TestClient(app)

def test_get_agent_context_success():
    # Mock data
    test_data = {
        "startup_id": "test_startup_123",
        "agent_role": "financial_analyst",
        "query": "What are the key financial metrics?",
        "top_k": 5,
        "threshold": 0.7
    }
    
    # Mock the agent context service
    mock_context = AgentContext(
        startup_id=test_data["startup_id"],
        agent_role=test_data["agent_role"],
        query=test_data["query"],
        enhanced_query="Enhanced: " + test_data["query"],
        relevant_chunks=[
            {
                "text": "The company has an annual revenue of $5M",
                "score": 0.85,
                "metadata": {"source": "financial_report_2023.pdf"}
            }
        ],
        analysis={
            "summary": "Strong revenue growth",
            "key_points": ["5M annual revenue"],
            "confidence": 0.85
        },
        timestamp="2023-01-01T00:00:00Z"
    )
    
    with patch('app.routers.agent_context.get_agent_context_service') as mock_service:
        mock_service.return_value.get_agent_context.return_value = mock_context.dict()
        
        # Make the request
        response = client.post("/api/agent/context", json=test_data)
        
        # Assert the response
        assert response.status_code == 200
        data = response.json()
        assert data["startup_id"] == test_data["startup_id"]
        assert data["agent_role"] == test_data["agent_role"]
        assert len(data["relevant_chunks"]) > 0
        assert data["analysis"]["summary"] == "Strong revenue growth"

def test_get_available_roles():
    # Make the request
    response = client.get("/api/agent/roles")
    
    # Assert the response
    assert response.status_code == 200
    data = response.json()
    assert "market_analyst" in data
    assert "financial_analyst" in data
    assert "product_analyst" in data
    assert "team_analyst" in data
    assert "risk_analyst" in data

def test_agent_context_model():
    # Test the AgentContext model
    context = AgentContext(
        startup_id="test_123",
        agent_role="financial_analyst",
        query="Test query",
        enhanced_query="Enhanced test query",
        relevant_chunks=[{"text": "Test chunk", "score": 0.9, "metadata": {}}],
        analysis={"summary": "Test analysis"},
        timestamp="2023-01-01T00:00:00Z"
    )
    
    assert context.startup_id == "test_123"
    assert context.agent_role == "financial_analyst"
    assert len(context.relevant_chunks) == 1
    assert context.analysis["summary"] == "Test analysis"
