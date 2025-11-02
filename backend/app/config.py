from pydantic_settings import BaseSettings
from typing import Optional, Literal
import os




# class Settings(BaseSettings):
#     # Database configuration
#     mongo_uri: str = "mongodb://localhost:27017/startup_ai"
#     mongodb_name: str = "startup_ai"
    
#     # Storage configuration
#     storage_path: str = "./uploads"
#     use_cloud: bool = False
#     gcloud_bucket: Optional[str] = None
#     redis_url: Optional[str] = None
    
#     # LLM Configuration
#     llm_provider: Literal['gemini', 'vertexai'] = "vertexai"  # Default to Vertex AI
#     # Vertex AI Configuration
#     vertex_project: Optional[str] = None
#     vertex_location: str = "us-central1"
#     vertex_model_name: str = "gemini-2.5-pro"
#     vertex_temperature: float = 0.7
#     # Authentication
#     google_application_credentials: Optional[str] = None
    
#     # Feature Flags
#     use_vision: bool = False

#     class Config:
#         env_file = ".env"
#         env_file_encoding = 'utf-8'
#         extra = "ignore"
        
#     def get_llm_config(self):
#         """Get LLM configuration based on the selected provider."""
#         if self.llm_provider == "vertexai":
#             return {
#                 "provider": "vertexai",
#                 "project": self.vertex_project,
#                 "location": self.vertex_location,
#                 "model_name": self.vertex_model_name,
#                 "temperature": self.vertex_temperature
#             }
#         else:  # gemini
#             return {
#                 "provider": "gemini",
#                 "api_key": self.gemini_api_key,
#                 "model_name": self.gemini_model_name,
#                 "temperature": self.gemini_model_temperature
#             }

class Settings:
    # Database configuration
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/startup_ai")
    mongodb_name: str = os.getenv("MONGODB_NAME", "startup_ai")
    
    # Storage configuration
    storage_path: str = os.getenv("STORAGE_PATH", "./uploads")
    use_cloud: bool = os.getenv("USE_CLOUD", "false").lower() == "true"
    gcloud_bucket: Optional[str] = os.getenv("GCLOUD_BUCKET")
    redis_url: Optional[str] = os.getenv("REDIS_URL")
    
    # LLM Configuration
    llm_provider: Literal['gemini', 'vertexai'] = os.getenv("LLM_PROVIDER", "vertexai").lower()
    
    # Vertex AI Configuration
    vertex_project: Optional[str] = os.getenv("VERTEX_PROJECT")
    vertex_location: str = os.getenv("VERTEX_LOCATION", "us-central1")
    vertex_model_name: str = os.getenv("VERTEX_MODEL_NAME", "gemini-2.5-pro")
    vertex_temperature: float = float(os.getenv("VERTEX_TEMPERATURE", "0.7"))
    
    # Authentication
    google_application_credentials: Optional[str] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", None)
    
    # Feature Flags
    use_vision: bool = os.getenv("USE_VISION", "false").lower() == "true"
    
    # Gemini Configuration (if using direct Gemini API)
    gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY")
    gemini_model_name: str = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-pro")
    gemini_model_temperature: float = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
    
    class Config:
        extra = "ignore"
        
    def get_llm_config(self):
        """Get LLM configuration based on the selected provider."""
        if self.llm_provider == "vertexai":
            return {
                "provider": "vertexai",
                "project": self.vertex_project,
                "location": self.vertex_location,
                "model_name": self.vertex_model_name,
                "temperature": self.vertex_temperature
            }
        else:  # gemini
            return {
                "provider": "gemini",
                "api_key": self.gemini_api_key,
                "model_name": self.gemini_model_name,
                "temperature": self.gemini_model_temperature
            }

settings = Settings()
