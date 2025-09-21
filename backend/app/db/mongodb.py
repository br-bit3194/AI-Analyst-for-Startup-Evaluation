from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
from dotenv import load_dotenv
from app.config import settings

# Load environment variables
load_dotenv()

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect_db(cls):
        """Initialize database connection using settings."""
        if not settings.mongo_uri:
            raise ValueError("mongo_uri is not configured in settings")
            
        # Create the client and use the database name from settings
        cls.client = AsyncIOMotorClient(settings.mongo_uri)
        cls.db = cls.client[settings.mongodb_name]
        
        # Test the connection
        try:
            await cls.db.command('ping')
            print("Successfully connected to MongoDB!")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise

    @classmethod
    async def close_db(cls):
        """Close database connection."""
        if cls.client:
            cls.client.close()

    @classmethod
    def get_db(cls):
        """Get database instance."""
        if not cls.db:
            raise RuntimeError("Database is not initialized. Call connect_db() first.")
        return cls.db

# Database instance
db_client = MongoDB()

def get_database():
    """Get database instance for dependency injection."""
    if db_client.db is None:
        raise RuntimeError("Database is not initialized. Call connect_db() first.")
    return db_client.db
