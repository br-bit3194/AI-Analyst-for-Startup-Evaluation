from datetime import datetime
from typing import Optional, List, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import Field, HttpUrl

class DocumentModel(Document):
    """
    Model for storing document metadata and content.
    """
    filename: str = Field(..., description="Original filename of the uploaded document")
    content_type: str = Field(..., description="MIME type of the document")
    size: int = Field(..., description="Size of the document in bytes")
    upload_date: datetime = Field(default_factory=datetime.utcnow, description="When the document was uploaded")
    processed: bool = Field(default=False, description="Whether the document has been processed")
    processing_errors: List[str] = Field(default_factory=list, description="Any errors that occurred during processing")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extracted metadata from the document")
    storage_path: Optional[str] = Field(None, description="Path to the stored document in the storage system")
    download_url: Optional[HttpUrl] = Field(None, description="URL to download the document")
    user_id: Optional[str] = Field(None, description="ID of the user who uploaded the document")
    
    class Settings:
        name = "documents"
        use_state_management = True

class DebateSession(Document):
    """
    Model for tracking debate sessions and their state.
    """
    title: str = Field(..., description="Title of the debate session")
    description: Optional[str] = Field(None, description="Description of the debate")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When the debate was created")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="When the debate was last updated")
    status: str = Field("pending", description="Current status of the debate (pending, in_progress, completed, failed)")
    participants: List[str] = Field(default_factory=list, description="List of participant IDs or names")
    messages: List[Dict[str, Any]] = Field(default_factory=list, description="List of messages in the debate")
    document_ids: List[PydanticObjectId] = Field(default_factory=list, description="List of document IDs referenced in this debate")
    settings: Dict[str, Any] = Field(default_factory=dict, description="Configuration settings for the debate")
    created_by: Optional[str] = Field(None, description="ID of the user who created the debate")
    
    class Settings:
        name = "debate_sessions"
        use_state_management = True
    
    def update_timestamp(self):
        """Update the updated_at timestamp."""
        self.updated_at = datetime.utcnow()
        return self
