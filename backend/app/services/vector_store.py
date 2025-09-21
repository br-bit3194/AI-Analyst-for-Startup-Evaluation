import os, asyncio
import json
import numpy as np
import faiss
from typing import List, Dict, Optional, Tuple
from sentence_transformers import SentenceTransformer
from pathlib import Path
import logging
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, storage_dir: str = "data/vector_store"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimension = 384  # Dimension of the all-MiniLM-L6-v2 model
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
        """Create embeddings for a list of text chunks."""
        if not texts:
            return np.array([])
        return self.model.encode(texts, convert_to_numpy=True)

    async def create_store(self, url: str, content: str) -> str:
        """Create a new vector store for a startup asynchronously."""
        import asyncio
        
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
            
        # Generate embeddings (CPU/GPU-bound, run in thread pool)
        texts = [chunk['text'] for chunk in chunks]
        embeddings = await loop.run_in_executor(
            None,
            lambda: self.get_embeddings(texts)
        )
        
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
                'embedding_index': i
            }
            
        # Save to disk (I/O-bound, run in thread pool)
        await loop.run_in_executor(
            None,
            self.save_store
        )
        
        return store_id

    def save_store(self):
        """Save the vector store to disk."""
        for store_id, metadata in self.metadata.items():
            store_path = self.get_store_path(store_id)
            store_path.mkdir(exist_ok=True)
            faiss.write_index(self.index, str(store_path / "index.faiss"))
            with open(store_path / "metadata.json", 'w') as f:
                json.dump(metadata, f, indent=2)

    def load_existing_store(self):
        """Load existing vector stores."""
        self.stores = {}
        for store_dir in self.storage_dir.glob('*'):
            if store_dir.is_dir():
                metadata_path = store_dir / 'metadata.json'
                if metadata_path.exists():
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                        self.stores[store_dir.name] = {
                            'metadata': metadata,
                            'index': faiss.read_index(str(store_dir / 'index.faiss'))
                        }

    def get_store(self, url: str):
        """Get an existing vector store for a URL."""
        store_id = self.generate_store_id(url)
        return self.stores.get(store_id)

    async def search_similar(self, url: str, query: str, k: int = 5) -> List[Dict]:
        """Search for similar content in the vector store asynchronously."""
        if self.index is None:
            return []
            
        loop = asyncio.get_event_loop()
            
        # Get query embedding (CPU/GPU-bound, run in thread pool)
        query_embedding = await loop.run_in_executor(
            None,
            lambda: self.get_embeddings([query])[0].reshape(1, -1)
        )
        
        # Search in FAISS (thread-safe operation)
        distances, indices = self.index.search(query_embedding, k)
        
        # Get metadata for results (thread-safe operation)
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx in self.metadata:
                results.append({
                    **self.metadata[idx],
                    'score': float(distance)
                })
                
        return results

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
        store_id = self.generate_store_id(url)
        store_path = self.get_store_path(store_id)
        
        if not store_path.exists():
            return await self.create_store(url, new_content)
            
        # Load existing metadata
        with open(store_path / "metadata.json", 'r') as f:
            metadata = json.load(f)
        
        # Create new chunks
        new_chunks = self.chunk_text(new_content)
        if not new_chunks:
            return store_id
            
        # Create embeddings for new chunks
        new_texts = [chunk['text'] for chunk in new_chunks]
        new_embeddings = self.create_embeddings(new_texts).astype('float32')
        
        # Load existing index
        index = faiss.read_index(str(store_path / "index.faiss"))
        
        # Add new vectors to index
        index.add(new_embeddings)
        
        # Update metadata
        metadata['chunks'].extend(new_chunks)
        metadata['updated_at'] = datetime.utcnow().isoformat()
        metadata['num_chunks'] = len(metadata['chunks'])
        
        # Save updated index and metadata
        faiss.write_index(index, str(store_path / "index.faiss"))
        with open(store_path / "metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
            
        # Update in-memory store
        self.load_existing_store()
        
        return store_id
