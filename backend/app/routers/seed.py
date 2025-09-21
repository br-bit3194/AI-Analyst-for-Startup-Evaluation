from fastapi import APIRouter, BackgroundTasks, HTTPException
import httpx
import uuid
from typing import List
from app.services.storage import save_file
from app.models import DocumentModel
from .upload import process_file, _ext

router = APIRouter(prefix="/seed", tags=["seed"])

@router.post("/ingest_urls", response_model=dict)
async def ingest_urls(urls: List[str], user_id: str | None = None, background_tasks: BackgroundTasks = None):
    if not urls:
        raise HTTPException(status_code=400, detail="No URLs provided")

    created = []
    async with httpx.AsyncClient(timeout=60) as client:
        for url in urls:
            try:
                resp = await client.get(url)
                resp.raise_for_status()
                content = resp.content
                # attempt to determine filename from URL
                url_name = url.split("?")[0].rstrip("/").rsplit("/", 1)[-1] or "file"
                filename = f"{uuid.uuid4().hex}_{url_name}"
                storage_path, local_path = save_file(content, filename)
                ext = _ext(filename)

                doc = DocumentModel(
                    user_id=user_id,
                    filename=url_name,
                    file_type=ext,
                    storage_path=storage_path,
                    status="uploaded",
                    metadata={"source_url": url, "local_path": local_path}
                )
                await doc.insert()
                doc.status = "processing"
                await doc.save()

                if background_tasks is not None:
                    background_tasks.add_task(process_file, str(doc.id), local_path, ext)
                else:
                    await process_file(str(doc.id), local_path, ext)

                created.append(str(doc.id))
            except Exception as e:
                created.append({"url": url, "error": str(e)})

    return {"created": created}
