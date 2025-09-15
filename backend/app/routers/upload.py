from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.storage import save_file_local

from app.services.parsers import parse_pdf, parse_docx, parse_pptx, parse_image, parse_txt
import uuid, asyncio
from app.models import DocumentModel

router = APIRouter(prefix="/upload", tags=["upload"])

def _ext(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower()

async def process_file(document_id: str, path: str, ext: str):
    loop = asyncio.get_running_loop()
    text = ""
    try:
        if ext == "pdf":
            text = await loop.run_in_executor(None, parse_pdf, path)
        elif ext == "docx":
            text = await loop.run_in_executor(None, parse_docx, path)
        elif ext in ("pptx", "ppt"):
            text = await loop.run_in_executor(None, parse_pptx, path)
        elif ext == "txt":
            text = await loop.run_in_executor(None, parse_txt, path)
        elif ext in ("png", "jpg", "jpeg", "tiff"):
            text = await loop.run_in_executor(None, parse_image, path)
        else:
            text = ""
        doc = await DocumentModel.get(document_id)
        if doc:
            doc.extracted_text = text
            doc.status = "processed"
            await doc.save()
    except Exception as e:
        doc = await DocumentModel.get(document_id)
        if doc:
            doc.status = "failed"
            doc.metadata = {"error": str(e)}
            await doc.save()

@router.post("/", response_model=dict)
async def upload_file(file: UploadFile = File(...), user_id: str | None = None):
    ext = _ext(file.filename)
    if ext not in ("pdf", "docx", "pptx", "ppt", "txt", "png", "jpg", "jpeg", "tiff"):
        raise HTTPException(status_code=400, detail="Unsupported file type.")
    file_bytes = await file.read()
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    path = save_file_local(file_bytes, filename)

    # Insert document
    doc = DocumentModel(
        user_id=user_id,
        filename=file.filename,
        file_type=ext,
        storage_path=path,
        status="uploaded"
    )
    await doc.insert()

    # Process immediately (synchronous for simplicity)
    await process_file(str(doc.id), path, ext)

    updated = await DocumentModel.get(doc.id)
    return {"id": str(updated.id), "status": updated.status}
