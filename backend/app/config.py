from pydantic_settings import BaseSettings
from typing import Optional, Literal
from pydantic import Field, model_validator
from functools import lru_cache
import logging
import os

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGO_URI: str = Field(
        default="mongodb://localhost:27017/startup_ai",
        description="MongoDB connection string"
    )
    
    # Storage Configuration
    STORAGE_PATH: str = Field(
        default="./uploads",
        description="Path to store uploaded files locally"
    )
    USE_CLOUD: bool = Field(
        default=False,
        description="Whether to use cloud storage (GCS)"
    )
    GCLOUD_BUCKET: Optional[str] = Field(
        default=None,
        description="Google Cloud Storage bucket name"
    )
    
    # Redis Configuration
    REDIS_URL: Optional[str] = Field(
        default=None,
        description="Redis connection URL"
    )
    
    # LLM Configuration
    LLM_PROVIDER: Literal["gemini", "openai"] = Field(
        default="gemini",
        description="Which LLM provider to use"
    )
    LLM_MODEL: str = Field(
        default="gemini-1.5-pro",
        description="Model name to use for LLM"
    )
    LLM_TEMPERATURE: float = Field(
        default=0.2,
        ge=0.0,
        le=1.0,
        description="Temperature for LLM generation (0.0 to 1.0)"
    )
    GEMINI_API_KEY: Optional[str] = Field(
        default=None,
        description="API key for Google's Gemini"
    )
    
    # Google Cloud Configuration
    GOOGLE_CLOUD_PROJECT: Optional[str] = Field(
        default=None,
        description="Google Cloud Project ID"
    )
    GOOGLE_CLOUD_LOCATION: str = Field(
        default="us-central1",
        description="Google Cloud location/region"
    )
    
    # Application Settings
    DEBUG: bool = Field(
        default=False,
        description="Enable debug mode"
    )
    LOG_LEVEL: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"  # Ignore extra fields in .env
    
    @model_validator(mode='after')
    def validate_settings(self):
        # Validate required settings based on provider
        if self.LLM_PROVIDER == "gemini" and not self.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is required when LLM_PROVIDER is 'gemini'")
        
        if self.USE_CLOUD and not self.GOOGLE_CLOUD_PROJECT:
            logger.warning("GOOGLE_CLOUD_PROJECT is required when USE_CLOUD is True")
        
        if self.USE_CLOUD and not self.GCLOUD_BUCKET:
            logger.warning("GCLOUD_BUCKET is recommended when USE_CLOUD is True")
        
        return self

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Global settings instance
settings = get_settings()
