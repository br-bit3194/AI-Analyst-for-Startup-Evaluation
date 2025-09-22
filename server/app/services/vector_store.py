import os
import asyncio
import json
import numpy as np
import faiss
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import logging
import hashlib
from datetime import datetime
import google.generativeai as genai
from google.generativeai.types import GenerationConfig

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, storage_dir: str = "data/vector_store"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize Gemini
        self.api_key = os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
            
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.embedding_model = 'models/embedding-001'  # Gemini's text embedding model
        self.dimension = 768  # Dimension of Gemini's text embedding model
        self.index = None
        self.metadata = {}
        self.load_existing_store()

    def get_store_path(self, store_id: str) -> Path:
        """Get path for storing vector store files."""
        return self.storage_dir / f"{store_id}"

    def generate_store_id(self, url: str) -> str:
        """Generate a unique ID for a startup based on its URL."""
        return hashlib.md5(url.encode()).hexdigest()

    def chunk_text(self, text: str, chunk_size: int = 512, overlap: int = 50) -> List[Dict]:
        """Split text into overlapping chunks with metadata."""
        if not text:
            return []
            
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            chunks.append({
                'text': chunk,
                'start_word': i,
                'end_word': min(i + chunk_size, len(words)),
                'timestamp': datetime.utcnow().isoformat()
            })
            
        return chunks

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Create embeddings for a list of text chunks using Gemini."""
        if not texts:
            return np.array([])
            
        try:
            # Batch process embeddings to handle API rate limits
            batch_size = 10  # Adjust based on your needs and API limits
            embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                response = genai.embed_content(
                    model=self.embedding_model,
                    content=batch,
                    task_type="retrieval_document"  # or "retrieval_query" for queries
                )
                embeddings.extend(response['embedding'])
                
            return np.array(embeddings, dtype='float32')
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise

    async def create_store(self, url: str, content: str) -> str:
        """Create a new vector store for a startup asynchronously."""
        # Run synchronous operations in a thread pool
        loop = asyncio.get_event_loop()
        
        # Generate store ID and path
        store_id = self.generate_store_id(url)
        store_path = self.get_store_path(store_id)
        
        # Create chunks (CPU-bound, run in thread pool)
        chunks = await loop.run_in_executor(
            None,  # Uses default ThreadPoolExecutor
            self.chunk_text, content
        )
        
        if not chunks:
            raise ValueError("No valid content to create vector store")
            
        # Generate embeddings (API call, run in thread pool)
        texts = [chunk['text'] for chunk in chunks]
        embeddings = await loop.run_in_executor(
            None,
            lambda: self.get_embeddings(texts)
        )
        
        # Ensure embeddings are the correct dimension
        if embeddings.shape[1] != self.dimension:
            logger.warning(f"Embedding dimension mismatch. Expected {self.dimension}, got {embeddings.shape[1]}")
            self.dimension = embeddings.shape[1]
        
        # Create or update FAISS index (thread-safe operation)
        if self.index is None:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = {}
        
        # Add to index (thread-safe operation)
        self.index.add(embeddings)
        
        # Update metadata (thread-safe operation)
        for i, chunk in enumerate(chunks, start=len(self.metadata)):
            self.metadata[i] = {
                **chunk,
                'store_id': store_id,
                'url': url,
                'embedding_index': i,
                'created_at': datetime.utcnow().isoformat()
            }
            
        # Save to disk (I/O-bound, run in thread pool)
        await loop.run_in_executor(
            None,
            self.save_store
        )
        
        return store_id

    def save_store(self):
        """Save the vector store to disk."""
        if not hasattr(self, 'metadata') or not self.metadata:
            logger.warning("No metadata to save")
            return
            
        # Group metadata by store_id
        stores_metadata = {}
        for idx, metadata in self.metadata.items():
            store_id = metadata.get('store_id')
            if not store_id:
                continue
                
            if store_id not in stores_metadata:
                stores_metadata[store_id] = {
                    'chunks': [],
                    'created_at': metadata.get('created_at', datetime.utcnow().isoformat()),
                    'updated_at': datetime.utcnow().isoformat(),
                    'url': metadata.get('url', '')
                }
                
            # Add chunk to the appropriate store
            chunk_metadata = {
                'text': metadata.get('text', ''),
                'start_word': metadata.get('start_word', 0),
                'end_word': metadata.get('end_word', 0),
                'timestamp': metadata.get('timestamp', datetime.utcnow().isoformat()),
                'embedding_index': idx
            }
            stores_metadata[store_id]['chunks'].append(chunk_metadata)
        
        # Save each store
        for store_id, store_data in stores_metadata.items():
            try:
                store_path = self.get_store_path(store_id)
                store_path.mkdir(parents=True, exist_ok=True)
                
                # Save FAISS index if available
                if self.index is not None:
                    faiss.write_index(self.index, str(store_path / "index.faiss"))
                
                # Save metadata
                with open(store_path / "metadata.json", 'w') as f:
                    json.dump(store_data, f, indent=2, default=str)
                    
                logger.info(f"Saved vector store {store_id} with {len(store_data.get('chunks', []))} chunks")
                
            except Exception as e:
                logger.error(f"Error saving vector store {store_id}: {str(e)}", exc_info=True)

    def load_existing_store(self):
        """Load existing vector stores."""
        self.stores = {}
        self.metadata = {}
        
        if not self.storage_dir.exists():
            return
            
        for store_dir in self.storage_dir.glob('*'):
            if not store_dir.is_dir():
                continue
                
            metadata_path = store_dir / 'metadata.json'
            index_path = store_dir / 'index.faiss'
            
            if not (metadata_path.exists() and index_path.exists()):
                continue
                
            try:
                # Load metadata
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                
                # Load FAISS index
                index = faiss.read_index(str(index_path))
                
                # Update dimension if needed
                if hasattr(index, 'd') and index.d != self.dimension:
                    logger.info(f"Updating dimension from {self.dimension} to {index.d} based on loaded index")
                    self.dimension = index.d
                
                # Store the loaded data
                self.stores[store_dir.name] = {
                    'metadata': metadata,
                    'index': index
                }
                
                # Update in-memory index and metadata
                if self.index is None:
                    self.index = faiss.IndexFlatL2(self.dimension)
                    
                    # If we have a single index, merge it into our main index
                    if len(self.stores) == 1:
                        self.index = index
                        
                        # Update metadata mapping
                        if 'chunks' in metadata:
                            for i, chunk in enumerate(metadata['chunks']):
                                self.metadata[i] = {
                                    **chunk,
                                    'store_id': store_dir.name,
                                    'embedding_index': i
                                }
                
            except Exception as e:
                logger.error(f"Error loading vector store from {store_dir}: {str(e)}", exc_info=True)
                continue

    def get_store(self, url: str):
        """Get an existing vector store for a URL."""
        store_id = self.generate_store_id(url)
        return self.stores.get(store_id)

    async def search_similar(self, url: str, query: str, k: int = 5) -> List[Dict]:
        """Search for similar content in the vector store asynchronously."""
        if not query or not query.strip():
            return []
            
        if self.index is None:
            await self.load_existing_store()
            if self.index is None:
                return []
            
        loop = asyncio.get_event_loop()
            
        try:
            # Get query embedding using Gemini (API call, run in thread pool)
            query_embedding = await loop.run_in_executor(
                None,
                lambda: self.get_embeddings([query])
            )
            
            if query_embedding is None or query_embedding.size == 0:
                logger.error("Failed to generate query embedding")
                return []
                
            query_embedding = query_embedding.reshape(1, -1)
            
            # Ensure the query embedding has the same dimension as the index
            if query_embedding.shape[1] != self.dimension:
                logger.warning(f"Query embedding dimension mismatch. Expected {self.dimension}, got {query_embedding.shape[1]}")
                self.dimension = query_embedding.shape[1]
                
                # Recreate index with correct dimension if needed
                if self.index.d != self.dimension:
                    self.index = faiss.IndexFlatL2(self.dimension)
                    # You might want to re-add all vectors here if the index is empty
            
            # Search in FAISS (thread-safe operation)
            k = min(k, len(self.metadata))  # Ensure k doesn't exceed the number of items
            if k <= 0:
                return []
                
            distances, indices = self.index.search(query_embedding.astype('float32'), k)
            
            # Get metadata for results (thread-safe operation)
            results = []
            for idx, distance in zip(indices[0], distances[0]):
                if idx in self.metadata:
                    results.append({
                        **self.metadata[idx],
                        'score': float(distance),
                        'relevance_score': 1.0 / (1.0 + float(distance))  # Convert distance to similarity score (0-1)
                    })
            
            # Sort by relevance score (highest first)
            results.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in search_similar: {str(e)}", exc_info=True)
            return []

    def store_exists(self, url: str) -> bool:
        """Check if a vector store exists for the given URL (synchronous)."""
        store_id = self.generate_store_id(url)
        store_path = self.get_store_path(store_id)
        return (store_path / "index.faiss").exists() and (store_path / "metadata.json").exists()
        
    async def store_exists_async(self, url: str) -> bool:
        """Check if a vector store exists for the given URL (asynchronous)."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.store_exists,
            url
        )

    async def update_store(self, url: str, new_content: str):
        """Update an existing vector store with new content asynchronously."""
        loop = asyncio.get_event_loop()
        store_id = self.generate_store_id(url)
        store_path = self.get_store_path(store_id)
        
        if not store_path.exists():
            return await self.create_store(url, new_content)
            
        # Load existing metadata
        with open(store_path / "metadata.json", 'r') as f:
            metadata = json.load(f)
        
        # Create new chunks
        new_chunks = await loop.run_in_executor(
            None,
            self.chunk_text, new_content
        )
        
        if not new_chunks:
            return store_id
            
        # Create embeddings for new chunks (API call, run in thread pool)
        new_texts = [chunk['text'] for chunk in new_chunks]
        new_embeddings = await loop.run_in_executor(
            None,
            lambda: self.get_embeddings(new_texts)
        )
        
        # Ensure embeddings are the correct dimension
        if new_embeddings.shape[1] != self.dimension:
            logger.warning(f"Embedding dimension mismatch. Expected {self.dimension}, got {new_embeddings.shape[1]}")
            self.dimension = new_embeddings.shape[1]
        
        # Load existing index
        index = faiss.read_index(str(store_path / "index.faiss"))
        
        # Add new vectors to index
        index.add(new_embeddings.astype('float32'))
        
        # Update metadata
        start_idx = len(metadata.get('chunks', []))
        metadata.setdefault('chunks', []).extend(new_chunks)
        metadata['updated_at'] = datetime.utcnow().isoformat()
        metadata['num_chunks'] = len(metadata['chunks'])
        
        # Update in-memory metadata
        for i, chunk in enumerate(new_chunks, start=start_idx):
            self.metadata[i] = {
                **chunk,
                'store_id': store_id,
                'url': url,
                'embedding_index': i,
                'updated_at': datetime.utcnow().isoformat()
            }
        
        # Save updated index and metadata
        faiss.write_index(index, str(store_path / "index.faiss"))
        with open(store_path / "metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
            
        return store_id
