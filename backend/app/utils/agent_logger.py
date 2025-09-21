from typing import Optional, Dict, Any, Union, Callable, Awaitable, TypeVar, cast
from functools import wraps
from datetime import datetime
import logging

# Type variable for generic function typing
T = TypeVar('T')

class AgentLogger:
    def __init__(self, agent_name: str, agent_id: Optional[str] = None):
        """
        A lightweight logger for agent-based console logging.
        
        Args:
            agent_name: Name of the agent (e.g., 'market_analyst', 'finance_analyst')
            agent_id: Optional unique identifier for the agent instance
        """
        self.agent_name = agent_name
        self.agent_id = agent_id or str(id(self))
        self.logger = logging.getLogger(f'agent.{agent_name}')
        
        # Configure logger if not already configured
        if not self.logger.handlers:
            self._configure_logger()
    
    def _configure_logger(self):
        """Configure the logger with console output."""
        # Create console handler with color support
        import sys
        from colorama import init, Fore, Style
        init()  # Initialize colorama
        
        class ColoredFormatter(logging.Formatter):
            COLORS = {
                'DEBUG': Fore.CYAN,
                'INFO': Fore.GREEN,
                'WARNING': Fore.YELLOW,
                'ERROR': Fore.RED,
                'CRITICAL': Fore.RED + Style.BRIGHT
            }
            
            def format(self, record):
                # Add agent context
                if not hasattr(record, 'agent_id'):
                    record.agent_id = getattr(record, 'agent_id', 'system')
                
                # Format the message with color
                levelname = record.levelname
                color = self.COLORS.get(levelname, Fore.WHITE)
                
                # Create the formatted message
                formatted = super().format(record)
                return f"{color}{formatted}{Style.RESET_ALL}"
        
        # Create console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(ColoredFormatter(
            '%(asctime)s | %(levelname)-8s | %(agent_id)-10s | %(name)s | %(message)s',
            datefmt='%H:%M:%S'
        ))
        
        # Configure logger
        self.logger.setLevel(logging.INFO)
        self.logger.addHandler(console_handler)
        self.logger.propagate = False
    
    def _log(self, level: str, message: str, extra: Optional[Dict[str, Any]] = None):
        """Internal method to handle logging with agent context."""
        log_extra = {'agent_id': self.agent_id, **(extra or {})}
        log_method = getattr(self.logger, level.lower())
        log_method(message, extra=log_extra)
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None):
        self._log('debug', message, extra)
    
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None):
        self._log('info', message, extra)
    
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None):
        self._log('warning', message, extra)
    
    def error(self, message: str, extra: Optional[Dict[str, Any]] = None):
        self._log('error', message, extra)
    
    def critical(self, message: str, extra: Optional[Dict[str, Any]] = None):
        self._log('critical', message, extra)
    
    def log_event(self, 
                 event_type: str, 
                 message: str, 
                 metadata: Optional[Dict[str, Any]] = None, 
                 level: str = 'info'):
        """
        Log a structured event with metadata.
        
        Args:
            event_type: Type of event (e.g., 'analysis_started')
            message: Human-readable message
            metadata: Additional context data
            level: Log level (default: 'info')
        """
        extra = {
            'event_type': event_type,
            **(metadata or {})
        }
        log_method = getattr(self, level.lower(), self.info)
        log_method(f"[{event_type.upper()}] {message}", extra=extra)
    
    def log_function_call(self, func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        """
        Decorator to log function calls with timing and results.
        
        Args:
            func: The async function to be decorated
            
        Returns:
            Wrapped function with logging
        """
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            func_name = func.__name__
            self.debug(f"→ {func_name}", {'args': args, 'kwargs': kwargs})
            
            start_time = datetime.utcnow()
            try:
                result = await func(*args, **kwargs)
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                self.debug(
                    f"✓ {func_name} completed in {duration:.3f}s",
                    {'result_type': type(result).__name__}
                )
                return result
                
            except Exception as e:
                duration = (datetime.utcnow() - start_time).total_seconds()
                self.error(
                    f"✗ {func_name} failed after {duration:.3f}s: {str(e)}",
                    {'error_type': type(e).__name__}
                )
                raise
                
        return cast(Callable[..., Awaitable[T]], async_wrapper)

# Example usage:
# logger = AgentLogger("market_analyst")
# @logger.log_function_call
# async def analyze_market(self, market_data):
#     # Agent logic here
#     pass
