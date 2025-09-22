# Agent Context Service

## Overview
The Agent Context Service provides relevant information from the vector store to assist investment committee agents in their analysis. It enhances queries based on the agent's role and retrieves the most relevant information from the vector store.

## Features

- **Role-based Query Enhancement**: Automatically enhances queries based on the agent's role (e.g., market analyst, financial analyst).
- **Semantic Search**: Retrieves the most relevant information from the vector store using semantic similarity.
- **Role-specific Analysis**: Provides role-specific analysis of the retrieved information.
- **Flexible Integration**: Can be easily integrated with existing agent workflows.

## API Endpoints

### Get Agent Context

**Endpoint**: `POST /api/agent/context`

Get relevant context for an agent based on their role and query.

**Request Body**:
```json
{
  "startup_id": "startup_123",
  "agent_role": "financial_analyst",
  "query": "What are the key financial metrics?",
  "top_k": 5,
  "threshold": 0.7
}
```

**Response**:
```json
{
  "startup_id": "startup_123",
  "agent_role": "financial_analyst",
  "query": "What are the key financial metrics?",
  "enhanced_query": "What are the key financial metrics? revenue, expenses, profit margins, cash flow, financial projections, unit economics, burn rate, runway, valuation, funding history",
  "relevant_chunks": [
    {
      "text": "The company has an annual revenue of $5M",
      "score": 0.85,
      "metadata": {
        "source": "financial_report_2023.pdf"
      }
    }
  ],
  "analysis": {
    "summary": "Strong revenue growth",
    "key_points": ["5M annual revenue"],
    "confidence": 0.85
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

### Get Available Roles

**Endpoint**: `GET /api/agent/roles`

Get the list of available agent roles and their descriptions.

**Response**:
```json
{
  "market_analyst": "Analyzes market size, competition, and growth potential",
  "financial_analyst": "Analyzes financial health, metrics, and projections",
  "product_analyst": "Evaluates product features and technical aspects",
  "team_analyst": "Assesses the founding team and company culture",
  "risk_analyst": "Identifies potential risks and challenges"
}
```

## Models

### AgentContext
```python
class AgentContext(BaseModel):
    startup_id: str
    agent_role: str
    query: str
    enhanced_query: str
    relevant_chunks: List[Dict[str, Any]] = []
    analysis: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

## Usage Example

```python
import requests

# Get relevant context for a financial analyst
response = requests.post(
    "http://localhost:8000/api/agent/context",
    json={
        "startup_id": "startup_123",
        "agent_role": "financial_analyst",
        "query": "What are the key financial metrics?",
        "top_k": 5,
        "threshold": 0.7
    }
)

if response.status_code == 200:
    context = response.json()
    print(f"Analysis Summary: {context['analysis']['summary']}")
    for chunk in context['relevant_chunks']:
        print(f"- {chunk['text']} (Score: {chunk['score']:.2f})")
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Startup not found
- `500 Internal Server Error`: Server error

## Testing

Run the tests with:

```bash
pytest tests/test_agent_context.py -v
```
