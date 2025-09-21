import os
import json
import time
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)

class MetadataService:
    def __init__(self, base_dir: str = "data/metadata"):
        """
        Initialize the metadata service.
        
        Args:
            base_dir: Base directory to store metadata files
        """
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.active_requests: Dict[str, str] = {}  # request_id -> metadata_path
        
    async def create_metadata(self, request_id: str, data: Dict) -> str:
        """
        Create a new metadata file with the given data.
        
        Args:
            request_id: Unique identifier for the request
            data: Metadata to store
            
        Returns:
            Path to the created metadata file
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
        filename = f"{timestamp}_{request_id}.json"
        metadata_path = self.base_dir / filename
        
        # Add timestamp and request_id to the data
        data.update({
            "request_id": request_id,
            "created_at": datetime.utcnow().isoformat(),
            "metadata_path": str(metadata_path)
        })
        
        # Write metadata to file
        with open(metadata_path, 'w') as f:
            json.dump(data, f, indent=2)
            
        # Track this active request
        self.active_requests[request_id] = str(metadata_path)
        
        logger.debug(f"Created metadata file: {metadata_path}")
        return str(metadata_path)
    
    async def get_metadata(self, request_id: str) -> Optional[Dict]:
        """
        Get metadata for a request.
        
        Args:
            request_id: The request ID to get metadata for
            
        Returns:
            The metadata dictionary, or None if not found
        """
        metadata_path = self.active_requests.get(request_id)
        if not metadata_path or not os.path.exists(metadata_path):
            return None
            
        try:
            with open(metadata_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading metadata file {metadata_path}: {e}")
            return None
    
    async def cleanup_metadata(self, request_id: str) -> bool:
        """
        Remove metadata file for a completed request.
        
        Args:
            request_id: The request ID to clean up
            
        Returns:
            True if cleanup was successful, False otherwise
        """
        metadata_path = self.active_requests.pop(request_id, None)
        if not metadata_path:
            return False
            
        try:
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
                logger.debug(f"Removed metadata file: {metadata_path}")
            return True
        except Exception as e:
            logger.error(f"Error removing metadata file {metadata_path}: {e}")
            return False
    
    async def cleanup_all_metadata(self):
        """Remove all metadata files (called on application shutdown)."""
        for request_id in list(self.active_requests.keys()):
            await self.cleanup_metadata(request_id)
    
    async def cleanup_old_metadata(self, max_age_hours: int = 24):
        """
        Clean up metadata files older than the specified hours.
        
        Args:
            max_age_hours: Maximum age of metadata files to keep (in hours)
        """
        now = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for file in self.base_dir.glob("*.json"):
            try:
                file_age = now - file.stat().st_mtime
                if file_age > max_age_seconds:
                    file.unlink()
                    logger.debug(f"Removed old metadata file: {file}")
            except Exception as e:
                logger.error(f"Error removing old metadata file {file}: {e}")

# Global instance
metadata_service = MetadataService()
