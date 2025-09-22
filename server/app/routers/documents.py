from fastapi import APIRouter, HTTPException
from typing import List
from app.models import DocumentModel

router = APIRouter(prefix="/documents", tags=["documents"])

@router.get("/", response_model=List[DocumentModel])
async def list_documents():
    docs = await DocumentModel.find_all().to_list()
    return docs

@router.get("/{doc_id}")
async def get_document(doc_id: str):
    doc = await DocumentModel.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc.dict()
