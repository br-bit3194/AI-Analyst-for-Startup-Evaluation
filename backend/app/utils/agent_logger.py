from typing import Optional, Dict, Any
import uuid
import json
from datetime import datetime
from functools import wraps

from app.logging_config import get_agent_logger

class AgentLogger:
    def __init__(self, agent_name: str, agent_id: Optional[str] = None):
        """
        Initialize an agent logger.
        
        Args:
            agent_name: Name of the agent (e.g., 'market_analyst', 'finance_analyst')
            agent_id: Optional unique ID for the agent instance
        """
        self.agent_name = agent_name
        self.agent_id = agent_id or str(uuid.uuid4())
        self.logger = get_agent_logger(f"agent.{agent_name}", self.agent_id)
    
    def log_event(self, event_type: str, message: str, metadata: Optional[Dict[str, Any]] = None, level: str = "info"):
        """
        Log an agent event with structured data.
        
        Args:
            event_type: Type of event (e.g., 'start', 'complete', 'error', 'decision')
            message: Human-readable message
            metadata: Additional context data
            level: Log level ('debug', 'info', 'warning', 'error', 'critical')
        """
        log_data = {
            "event_type": event_type,
            "agent": self.agent_name,
            "agent_id": self.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
            "metadata": metadata or {}
        }
        
        log_method = getattr(self.logger, level.lower(), self.logger.info)
        log_method(
            f"[{event_type.upper()}] {message}",
            extra={
                "agent_id": self.agent_id,
                "event_data": log_data
            }
        )
        
        return log_data
    
    def log_agent_call(self, func):
        """
        Decorator to log agent function calls with timing and results.
        """
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract input data for logging
            input_data = {
                "args": args[1:],  # Skip self
                "kwargs": {k: v for k, v in kwargs.items() if not k.startswith('_')}
            }
            
            # Log start of operation
            self.log_event(
                "agent_call_start",
                f"Starting {func.__name__}",
                {"input": input_data}
            )
            
            try:
                start_time = datetime.utcnow()
                result = await func(*args, **kwargs)
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                # Log successful completion
                self.log_event(
                    "agent_call_complete",
                    f"Completed {func.__name__} in {duration:.2f}s",
                    {
                        "duration_seconds": duration,
                        "result_type": type(result).__name__
                    }
                )
                return result
                
            except Exception as e:
                # Log error
                self.log_event(
                    "agent_call_error",
                    f"Error in {func.__name__}: {str(e)}",
                    {
                        "error": str(e),
                        "error_type": type(e).__name__,
                        "traceback": str(e.__traceback__)
                    },
                    level="error"
                )
                raise
                
        return wrapper

# Example usage:
# logger = AgentLogger("market_analyst")
# @logger.log_agent_call
# async def analyze_market(self, market_data):
#     # Agent logic here
#     pass
