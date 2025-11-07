import uuid
import json
import traceback

from typing import Dict, List, Optional, Any
from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from app.config import settings
from app.models.analysis import AnalysisHistory, AnalysisResult, AnalysisSummary, CommitteeMember

HTTP_500_INTERNAL_SERVER_ERROR = status.HTTP_500_INTERNAL_SERVER_ERROR

def _get_db_name_from_uri(uri: str) -> str:
    if not uri:
        return "startup_ai"
    # strip query params
    uri_no_q = uri.split('?', 1)[0]
    # if last slash contains a db name, return it
    if '/' in uri_no_q:
        candidate = uri_no_q.rsplit('/', 1)[-1]
        if candidate:
            return candidate
    return "startup_ai"

class MongoDBService:
    _instance = None
    _initialized = False
    _lock = asyncio.Lock()
    _client = None
    _db = None

    def __new__(cls, collection_name: str = "analysis_results"):
        if cls._instance is None:
            cls._instance = super(MongoDBService, cls).__new__(cls)
            cls._instance._collection_name = collection_name
            cls._instance._initialized = False
        elif hasattr(cls._instance, '_collection_name') and collection_name != cls._instance._collection_name:
            raise ValueError(f"MongoDBService already initialized with collection: {cls._instance._collection_name}")
        return cls._instance

    async def initialize(self):
        """Initialize the database connection if not already initialized."""
        if not self._initialized:
            async with self._lock:
                if not self._initialized:  # Double-checked locking pattern
                    try:
                        # Initialize MongoDB client and database
                        self._client = AsyncIOMotorClient(settings.mongo_uri)
                        self._db_name = _get_db_name_from_uri(settings.mongo_uri)
                        self._db = self._client[self._db_name]
                        self.analysis_collection = self._db[self._collection_name]
                        
                        # Test the connection
                        await self._db.command('ping')
                        print(f"Successfully connected to MongoDB collection: {self._collection_name}")
                        
                        self._initialized = True
                        
                    except Exception as e:
                        raise RuntimeError(f"Failed to initialize MongoDBService: {str(e)}")
                    
    async def close(self):
        """Close the MongoDB connection."""
        if self._client:
            self._client.close()
            self._initialized = False

    def __init__(self, collection_name: str = "analysis_results"):
        if not self._initialized:
            self._collection_name = collection_name

    async def _ensure_initialized(self):
        """Ensure the service is properly initialized."""
        if not self._initialized:
            await self.initialize()
            
        if not hasattr(self, 'analysis_collection') or self.analysis_collection is None:
            raise RuntimeError("MongoDBService not properly initialized")

    async def save_analysis_results(
        self, 
        analysis_id: str, 
        result_data: Dict[str, Any],
        user_id: str = "system",
        status: str = "completed"
    ) -> bool:
        """
        Save analysis results to MongoDB.
        
        Args:
            analysis_id: The ID of the analysis
            result_data: The analysis results to save
            user_id: ID of the user who owns the analysis
            status: Status of the analysis (processing/completed/failed)
            
        Returns:
            bool: True if save was successful, False otherwise
        """
        print(f"\n[DEBUG] {'='*50}")
        print(f"[DEBUG] Starting save_analysis_results for ID: {analysis_id}")
        print(f"[DEBUG] User ID: {user_id}, Status: {status}")
        print(f"[DEBUG] Result data type: {type(result_data)}")
        print(f"[DEBUG] Result data keys: {list(result_data.keys())}")
        
        try:
            # Ensure MongoDB is initialized
            print("[DEBUG] Ensuring MongoDB is initialized...")
            await self._ensure_initialized()
            print("[DEBUG] MongoDB service initialized successfully")
            
            # Verify collection exists and is accessible
            collection_info = await self._db.list_collection_names()
            print(f"[DEBUG] Available collections: {collection_info}")
            
            if self._collection_name not in collection_info:
                print(f"[WARNING] Collection '{self._collection_name}' does not exist, it will be created on first insert")
            
            # First, check if document exists
            existing_doc = await self.analysis_collection.find_one({"analysis_id": analysis_id})
            
            # Prepare the document with all fields
            current_time = datetime.utcnow()
            document = {
                "analysis_id": analysis_id,
                "user_id": user_id,
                "status": status,
                "created_at": result_data.get("created_at", existing_doc["created_at"] if existing_doc else current_time),
                "updated_at": current_time,
                "message": result_data.get("message", existing_doc.get("message", "") if existing_doc else ""),
                "timestamp": result_data.get("timestamp", current_time.isoformat())
            }
            
            # Add the result if it exists
            if "result" in result_data:
                document["result"] = result_data["result"]
            
            # Add any additional fields from result_data
            for key, value in result_data.items():
                if key not in document and key not in ["_id", "analysis_id", "user_id", "status", "created_at", "updated_at", "message", "timestamp"]:
                    document[key] = value
            
            # Ensure _id is a string, not UUID
            document["_id"] = str(uuid.uuid4())
            
            print(f"[DEBUG] Document to save: {json.dumps(document, default=str, indent=2)}")
            
            # Always use update_one with upsert to ensure we update existing records
            try:
                print(f"[DEBUG] Attempting to upsert document for analysis_id: {analysis_id}")
                
                # Prepare the update operation
                current_time = datetime.utcnow()
                
                # For new documents, ensure we have required fields
                if '_id' not in document:
                    document['_id'] = analysis_id
                if 'created_at' not in document:
                    document['created_at'] = current_time
                
                # Always update the updated_at timestamp
                document['updated_at'] = current_time
                
                # Create a copy of the document without _id and created_at for the $set operation
                document_to_update = {k: v for k, v in document.items() if k not in ['_id', 'created_at']}
                
                # Prepare the update operation
                update_operation = {
                    "$set": document_to_update,
                    "$setOnInsert": {
                        "_id": document['_id']
                    }
                }
                
                # Only include created_at in $setOnInsert if it exists in the document
                if 'created_at' in document:
                    update_operation["$setOnInsert"]["created_at"] = document['created_at']
                
                # Use update_one with upsert to handle both insert and update in one operation
                update_result = await self.analysis_collection.update_one(
                    {"analysis_id": analysis_id},
                    update_operation,
                    upsert=True
                )
                
                # For upsert operations, we need to handle the case where a new document was inserted
                if update_result.upserted_id:
                    print(f"[DEBUG] Inserted new document with _id: {update_result.upserted_id}")
                else:
                    print(f"[DEBUG] Updated existing document - matched: {update_result.matched_count}, modified: {update_result.modified_count}")
                
                # Check if the operation was successful
                if getattr(update_result, 'acknowledged', False):
                    # The operation was successful if it was acknowledged
                    # For upsert operations, we consider it successful if it was acknowledged
                    # regardless of whether it was an insert or update
                    return True
                
                print("[WARNING] Operation was not acknowledged by MongoDB")
                return False
                
            except Exception as update_error:
                print(f"[ERROR] Failed to update document: {str(update_error)}")
                traceback.print_exc()
                raise update_error
            
        except Exception as e:
            error_msg = f"[CRITICAL] Failed to save analysis results: {str(e)}"
            print(error_msg)
            traceback.print_exc()
            
            # Try to get more MongoDB-specific error information
            if hasattr(e, 'details'):
                print(f"[ERROR] MongoDB error details: {e.details}")
                
            # Try a simple ping to check connection
            try:
                ping_result = await self._db.command('ping')
                print(f"[DEBUG] MongoDB ping result: {ping_result}")
            except Exception as ping_error:
                print(f"[ERROR] MongoDB ping failed: {str(ping_error)}")
            
            # Don't raise HTTPException here, let the caller handle it
            print(f"[DEBUG] {'='*50}\n")
            return False

    async def get_analysis_results(
        self, 
        analysis_id: str, 
        user_id: str = "system"
    ) -> Dict[str, Any]:
        """
        Retrieve analysis results by analysis ID.
        
        Args:
            analysis_id: The ID of the analysis to retrieve
            user_id: ID of the user who owns the analysis (default: "system")
            
        Returns:
            Dict containing the analysis results or None if not found
            
        Raises:
            HTTPException: If there's an error fetching the analysis
        """
        print(f"\n[DEBUG] {'='*50}")
        print(f"[DEBUG] Fetching analysis results for ID: {analysis_id}")
        await self._ensure_initialized()
        
        try:
            # Find the most recent document for this analysis_id by sorting on updated_at
            cursor = self.analysis_collection.find(
                {"analysis_id": analysis_id}
            ).sort("updated_at", -1).limit(1)
            
            # Get the first (most recent) document
            documents = await cursor.to_list(length=1)
            document = documents[0] if documents else None
            
            if not document:
                print(f"[DEBUG] No document found with analysis_id: {analysis_id}")
                return None
                
            print(f"[DEBUG] Found most recent document with ID: {document.get('_id')}")
            print(f"[DEBUG] Document status: {document.get('status')}")
            print(f"[DEBUG] Document updated_at: {document.get('updated_at')}")
            print(f"[DEBUG] Document keys: {list(document.keys())}")
            
            # Convert ObjectId to string for JSON serialization
            if '_id' in document:
                document['_id'] = str(document['_id'])
            
            # Get the status from the document, with a fallback to 'unknown'
            status = document.get('status', 'unknown')
            print(f"[DEBUG] Retrieved status: {status}")
            
            # Ensure all fields are present to match the expected structure
            result = {
                '_id': document.get('analysis_id'),
                'analysis_id': document.get('analysis_id'),
                'status': status,
                'message': document.get('message', ''),
                'created_at': document.get('created_at'),
                'updated_at': document.get('updated_at', datetime.utcnow()),
                'user_id': document.get('user_id', user_id),
                'result': document.get('result', {})
            }
            
            # Add any additional fields from the document
            for key, value in document.items():
                if key not in result and key not in ['_id', 'analysis_id', 'status', 'message', 'created_at', 'updated_at', 'user_id', 'result']:
                    result[key] = value
            
            print(f"[DEBUG] Returning result with status: {result.get('status')}")
            print(f"[DEBUG] {'='*50}\n")
            return result
            
        except Exception as e:
            error_msg = f"Error fetching analysis results: {str(e)}"
            print(f"[ERROR] {error_msg}", exc_info=True)
            print(f"[DEBUG] {'='*50}\n")
            raise HTTPException(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
            
        except HTTPException:
            # Re-raise any HTTP exceptions
            raise
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve analysis results: {str(e)}"
            )

    async def list_user_analyses(
        self, 
        user_id: str, 
        limit: int = 10, 
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        await self._ensure_initialized()
        """
        List all analyses for a specific user.
        
        Args:
            user_id: ID of the user
            limit: Maximum number of results to return
            skip: Number of results to skip for pagination
            
        Returns:
            List of analysis summaries
        """
        try:
            cursor = self.analysis_collection.find(
                {"user_id": user_id},
                {
                    "summary": 1,
                    "status": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "_id": 1
                }
            ).sort("created_at", -1).skip(skip).limit(limit)
            
            analyses = []
            async for doc in cursor:
                doc["analysis_id"] = str(doc.pop("_id"))  # Convert ObjectId to string
                analyses.append(doc)
                
            return analyses
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list user analyses: {str(e)}"
            )

# Singleton instance
mongodb_service = MongoDBService()
