from typing import Dict, Set, Optional
import asyncio
from fastapi import WebSocket
import json
import uuid

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, analysis_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            if analysis_id not in self.active_connections:
                self.active_connections[analysis_id] = set()
            self.active_connections[analysis_id].add(websocket)

    def disconnect(self, analysis_id: str, websocket: WebSocket):
        async def _disconnect():
            async with self.lock:
                if analysis_id in self.active_connections:
                    self.active_connections[analysis_id].discard(websocket)
                    if not self.active_connections[analysis_id]:
                        del self.active_connections[analysis_id]
        asyncio.create_task(_disconnect())

    async def send_progress_update(self, analysis_id: str, message: str, progress: int):
        """
        Send progress update to all connections for a specific analysis
        
        Args:
            analysis_id: The ID of the analysis
            message: The progress message to send
            progress: Progress percentage (0-100)
        """
        if analysis_id not in self.active_connections:
            return
            
        message_data = {
            "type": "progress_update",
            "message": message,
            "progress": progress,
            "timestamp": str(asyncio.get_event_loop().time())
        }
        
        # Create tasks for sending to all connections
        send_tasks = []
        async with self.lock:
            for websocket in self.active_connections.get(analysis_id, set()).copy():
                try:
                    send_tasks.append(
                        websocket.send_json(message_data)
                    )
                except Exception as e:
                    print(f"Error sending to WebSocket: {e}")
                    self.disconnect(analysis_id, websocket)
        
        # Wait for all sends to complete
        if send_tasks:
            await asyncio.gather(*send_tasks, return_exceptions=True)

# Global WebSocket manager instance
websocket_manager = ConnectionManager()
