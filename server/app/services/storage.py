import os
from app.config import settings
from typing import Tuple, Optional

try:
    from google.cloud import storage as gcs
except Exception:
    gcs = None

def save_file_local(file_bytes: bytes, filename: str) -> str:
    os.makedirs(settings.storage_path, exist_ok=True)
    path = os.path.join(settings.storage_path, filename)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path

def upload_to_gcs(local_path: str, filename: str) -> Optional[str]:
    if not settings.use_cloud or not settings.gcloud_bucket:
        return None
    if gcs is None:
        return None
    client = gcs.Client()
    bucket = client.bucket(settings.gcloud_bucket)
    blob = bucket.blob(filename)
    blob.upload_from_filename(local_path)
    return f"gs://{settings.gcloud_bucket}/{filename}"

def save_file(file_bytes: bytes, filename: str) -> Tuple[str, str]:
    """
    Save file locally for processing. If USE_CLOUD is enabled, also upload to GCS.
    Returns (storage_path, local_path) where storage_path is the canonical path to store
    in DB (GCS URI if cloud, else local path), and local_path is always the local file path.
    """
    local_path = save_file_local(file_bytes, filename)
    storage_path = local_path
    if settings.use_cloud:
        gcs_uri = upload_to_gcs(local_path, filename)
        if gcs_uri:
            storage_path = gcs_uri
    return storage_path, local_path
