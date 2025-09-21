from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database configuration
    mongo_uri: str = "mongodb://localhost:27017/startup_ai"
    mongodb_name: str = "startup_ai"
    
    # Storage configuration
    storage_path: str = "./uploads"
    use_cloud: bool = False
    gcloud_bucket: Optional[str] = None
    redis_url: Optional[str] = None
    # LLM Configuration
    llm_provider: str = "gemini"
    gemini_api_key: Optional[str] = None
    gemini_model_name: str = "gemini-2.5-flash"  # Default model name
    gemini_model_temperature: float = 0.7  # Default temperature (0.0 to 1.0)
    
    # Feature Flags
    use_vision: bool = False

    class Config:
        env_file = ".env"
        extra="ignore"


settings = Settings()
