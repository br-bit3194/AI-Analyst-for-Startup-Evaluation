from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # default to local DB so app starts even if .env missing
    mongo_uri: str = "mongodb://localhost:27017/startup_ai"
    storage_path: str = "./uploads"
    use_cloud: bool = False
    gcloud_bucket: Optional[str] = None
    redis_url: Optional[str] = None
    llm_provider: str = "custom"
    openai_api_key: str

    class Config:
        env_file = ".env"

settings = Settings()
