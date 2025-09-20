from fastapi import APIRouter, HTTPException
from app.services.orchestrator import start_session, run_next_round
from app.models import DebateSession, DocumentModel

router = APIRouter(prefix="/debate", tags=["debate"])

@router.post("/start")
async def api_start(topic: str, document_id: str | None = None):
    doc_text = ""
    if document_id:
        doc = await DocumentModel.get(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        if not doc.extracted_text:
            raise HTTPException(400, detail="Document not processed yet")
        doc_text = doc.extracted_text

    agents = [
        {"name": "Risk Analyst", "role": "You are a Risk Analyst."},
        {"name": "Market Expert", "role": "You are a Market Expert."},
        {"name": "Finance Partner", "role": "You are a Finance Partner."},
        {"name": "Skeptical VC", "role": "You are a Skeptical VC."}
    ]

    full_topic = topic
    if doc_text:
        full_topic += f"\n\nDocument Content:\n{doc_text[:1000]}"

    session = await start_session(full_topic, agents)
    return {"id": str(session.id), "topic": topic, "document_id": document_id}

@router.post("/{session_id}/next")
async def api_next(session_id: str):
    reply = await run_next_round(session_id)
    return {"reply": reply}

@router.get("/{session_id}")
async def get_session(session_id: str):
    session = await DebateSession.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.dict()
