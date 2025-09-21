from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # default to local DB so app starts even if .env missing
    mongo_uri: str = "mongodb://localhost:27017/startup_ai"
    storage_path: str = "./uploads"
    use_cloud: bool = False
    gcloud_bucket: Optional[str] = None
    redis_url: Optional[str] = None
    llm_provider: str = "gemini"
    gemini_api_key: Optional[str] = None
    use_vision: bool = False

    class Config:
        env_file = ".env"
        extra="ignore"


settings = Settings()
