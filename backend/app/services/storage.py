import os
from app.config import settings

def save_file_local(file_bytes: bytes, filename: str) -> str:
    os.makedirs(settings.storage_path, exist_ok=True)
    path = os.path.join(settings.storage_path, filename)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path
