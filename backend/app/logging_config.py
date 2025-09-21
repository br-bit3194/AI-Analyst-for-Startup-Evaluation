import logging
import sys
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional

from app.config import settings

# Ensure logs directory exists
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True, parents=True)

# Agent-specific log formatter
class AgentLogFormatter(logging.Formatter):    
    def format(self, record):
        # Add agent_id to log record if it exists
        if not hasattr(record, 'agent_id'):
            record.agent_id = 'system'
        return super().format(record)

def setup_logger(name: str, log_level: Optional[str] = None) -> logging.Logger:
    """
    Set up a logger with both file and console handlers.
    
    Args:
        name: Logger name (usually __name__)
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Don't propagate to root logger to avoid duplicate logs
    logger.propagate = False
    
    # Set log level
    level = getattr(logging, log_level or "INFO")
    logger.setLevel(level)
    
    # Create formatters
    file_formatter = AgentLogFormatter(
        '%(asctime)s - %(agent_id)s - %(levelname)s - %(name)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_formatter = AgentLogFormatter(
        '%(asctime)s - %(agent_id)s - %(levelname)s - %(name)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # Create file handler
    log_file = LOG_DIR / f"{name.replace('.', '_')}.log"
    file_handler = RotatingFileHandler(
        log_file, 
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(file_formatter)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    
    # Add handlers if not already added
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    return logger

def get_agent_logger(agent_name: str, agent_id: str, log_level: str = None):
    """
    Get a logger for a specific agent with agent_id injected into log records.
    """
    logger = setup_logger(f"agent.{agent_name}", log_level)
    
    class AgentLoggerAdapter(logging.LoggerAdapter):
        def process(self, msg, kwargs):
            # Add agent_id to extra for the formatter
            if 'extra' not in kwargs:
                kwargs['extra'] = {}
            kwargs['extra']['agent_id'] = agent_id
            return msg, kwargs
    
    return AgentLoggerAdapter(logger, {})

# Initialize root logger
root_logger = setup_logger("startup_ai")

# Configure uvicorn logger
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_logger.handlers = []
uvicorn_logger.propagate = True
uvicorn_logger.setLevel(logging.WARNING)
