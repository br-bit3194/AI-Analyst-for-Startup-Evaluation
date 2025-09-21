from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])

# Example in-memory storage for demo
ai_outputs = {
    "deal_123": "Strengths: ...\nRisks: ...\nBenchmarks: ..."
}

class AIOutputRequest(BaseModel):
    deal_id: str

@router.post("/preview")
async def preview_ai_output(request: AIOutputRequest):
    try:
        content = ai_outputs.get(request.deal_id)
        if not content:
            raise HTTPException(status_code=404, detail="No AI output found for this deal")
        return {"deal_id": request.deal_id, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
