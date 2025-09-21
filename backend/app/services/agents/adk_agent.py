"""
Agent implementation using Google's Agent Development Kit (ADK).
"""
import os
import json
import asyncio
from typing import Dict, List, Optional, Any, Union, Callable
from datetime import datetime
try:
    from google import adk  # type: ignore
except Exception:  # pragma: no cover - fallback in environments without google-adk
    import logging as _logging
    _logging.getLogger(__name__).warning(
        "google.adk not available; using fallback dummy ADK implementation."
    )

    class _DummyResponse:
        def __init__(self, text: str):
            self.text = text

    class _DummyGemini:
        def __init__(self, model_name: str, instructions: str, project_id: str, location: str, temperature: float):
            self.model_name = model_name
            self.instructions = instructions
            self.project_id = project_id
            self.location = location
            self.temperature = temperature

    class _DummyAgent:
        def __init__(self, name: str, model: _DummyGemini):
            self.name = name
            self.model = model
            self.model_name = getattr(model, 'model_name', 'dummy-model')

        async def generate_response(self, message: str):
            preview = message if len(str(message)) < 180 else str(message)[:180] + "..."
            return _DummyResponse(
                text=f"[Dummy-{self.model_name}] {self.name} analyzed the pitch. Summary: {preview}"
            )

    class _DummyADK:
        Agent = _DummyAgent
        Gemini = _DummyGemini

    adk = _DummyADK()  # type: ignore
from pydantic import BaseModel, Field
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class AgentResponse(BaseModel):
    """Standardized response format for agent interactions."""
    success: bool
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None

class ToolConfig(BaseModel):
    """Configuration for a tool that can be used by the agent."""
    name: str
    description: str
    parameters: Dict[str, Any] = {}
    enabled: bool = True

class ADKAgent:
    """Wrapper around ADK Agent for our use case."""
    
    def __init__(
        self,
        name: str,
        instructions: str,
        model: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        project_id: Optional[str] = None,
        location: Optional[str] = None,
        temperature: Optional[float] = None
    ):
        """Initialize the ADK agent.
        
        Args:
            name: Name of the agent
            instructions: Instructions for the agent
            model: Model to use (default: from settings or "gemini-1.5-pro")
            tools: List of tool configurations
            project_id: Google Cloud project ID (default: from settings)
            location: Google Cloud location/region (default: from settings)
            temperature: Temperature for model generation (default: from settings or 0.2)
        """
        self.name = name
        self.instructions = instructions
        self.model = model or settings.LLM_MODEL
        self.project_id = project_id or settings.GOOGLE_CLOUD_PROJECT
        self.location = location or settings.GOOGLE_CLOUD_LOCATION
        self.temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
        
        # Store tools configuration
        self.tools_config = tools or []
        self.tools = {}  # Store registered tool functions
        
        if not self.project_id:
            logger.warning(
                "Google Cloud Project ID not set; defaulting to 'local' for development."
            )
            self.project_id = "local"
        
        # Prepare Gemini model config
        # Only pass allowed fields to adk.Agent
        if hasattr(adk, "Gemini"):
            gemini_model = adk.Gemini(
                model_name=self.model,
                instructions=self.instructions,
                project_id=self.project_id,
                location=self.location,
                temperature=self.temperature
            )
            self.agent = adk.Agent(
                name=self.name,
                model=gemini_model
            )
        else:
            # Fallback: pass only name and model string
            self.agent = adk.Agent(
                name=self.name,
                model=self.model
            )
        
        # Initialize agent (no chat session in ADK)
        # Register tools if any
        tools = self._create_tool_functions()
        if tools and hasattr(self.agent, 'register_tools'):
            self.agent.register_tools(tools)
    
    def _create_tool_functions(self) -> List[callable]:
        """Create tool functions from tool configurations."""
        tool_functions = []
        
        for tool_config in self.tools_config:
            try:
                tool_name = tool_config.get('name', 'unnamed_tool')
                
                # Get the function or create a default one
                if 'function' in tool_config and callable(tool_config['function']):
                    func = tool_config['function']
                elif 'callable' in tool_config and callable(tool_config['callable']):
                    func = tool_config['callable']
                else:
                    # Create a default function if none provided
                    async def default_tool(**kwargs):
                        return {
                            "status": "success",
                            "message": f"Called {tool_name}",
                            "data": kwargs
                        }
                    func = default_tool
                
                # Create a tool function with proper name and docstring
                tool_func = func
                tool_func.__name__ = tool_name
                tool_func.__doc__ = tool_config.get('description', f"Tool: {tool_name}")
                
                # Store the tool function
                self.tools[tool_name] = tool_func
                tool_functions.append(tool_func)
                
                logger.info(f"Created tool function: {tool_name}")
                
            except Exception as e:
                logger.error(f"Failed to create tool {tool_config.get('name', 'unknown')}: {str(e)}")
                logger.debug(f"Tool config that failed: {tool_config}")
        
        return tool_functions
    
    async def process_message(self, message: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """Process a message with the agent.
        
        Args:
            message: The message to process
            context: Optional context dictionary
            
        Returns:
            AgentResponse containing the agent's response
        """
        try:
            # Include context in the message if provided
            if context:
                # Convert context to a formatted string
                context_str = json.dumps(context, indent=2)
                message = f"Context:\n{context_str}\n\nMessage:\n{message}"
            
            # Get the model name for metadata
            model_name = getattr(self.agent, 'model_name', getattr(self, 'model', 'unknown'))
            
            # Check if we have a valid agent with a model
            if hasattr(self.agent, 'generate_response'):
                # Use the agent's generate_response method if available
                response = await self.agent.generate_response(message)
                response_content = getattr(response, 'text', str(response))
            elif hasattr(self.agent, 'model') and hasattr(self.agent.model, 'generate_content'):
                # If agent has a model with generate_content method
                response = await self.agent.model.generate_content(message)
                response_content = getattr(response, 'text', str(response))
            elif hasattr(self.agent, 'model') and callable(self.agent.model):
                # If agent's model is callable directly
                response = await self.agent.model(message)
                response_content = getattr(response, 'text', str(response))
            else:
                # Fallback to a simple response indicating the agent is not properly configured
                response_content = (
                    f"I'm {self.name}, but I'm not properly configured to respond. "
                    f"Please check my configuration. (Model: {model_name})"
                )
                return AgentResponse(
                    success=False,
                    content=response_content,
                    error="Agent not properly configured",
                    metadata={
                        "agent": self.name,
                        "model": model_name,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            
            return AgentResponse(
                success=True,
                content=response_content,
                metadata={
                    "agent": self.name,
                    "model": model_name,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            error_msg = f"Error processing message with {self.name}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return AgentResponse(
                success=False,
                content=error_msg,
                error=str(e),
                metadata={
                    "agent": self.name,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

class ADKAgentManager:
    """Manages multiple ADK agents and coordinates their interactions."""
    
    def __init__(
        self, 
        project_id: Optional[str] = None, 
        location: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None
    ):
        """Initialize the agent manager.
        
        Args:
            project_id: Google Cloud project ID (default: from settings)
            location: Google Cloud location/region (default: from settings)
            model: Default model to use for agents (default: from settings)
            temperature: Default temperature for agents (default: from settings)
        """
        self.project_id = project_id or settings.GOOGLE_CLOUD_PROJECT
        self.location = location or settings.GOOGLE_CLOUD_LOCATION
        self.default_model = model or settings.LLM_MODEL
        self.default_temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
        self.agents: Dict[str, ADKAgent] = {}
        
        if not self.project_id:
            logger.warning(
                "Google Cloud Project ID not set; defaulting to 'local' for development."
            )
            self.project_id = "local"
    
    def add_agent(self, agent: ADKAgent, **kwargs) -> None:
        """Add an agent to the manager.
        
        Args:
            agent: The agent to add
            **kwargs: Additional arguments to override agent settings
        """
        # Update agent configuration if overrides are provided
        if kwargs:
            for key, value in kwargs.items():
                if hasattr(agent, key):
                    setattr(agent, key, value)
                    # Also update the underlying ADK agent if the attribute exists
                    if hasattr(agent.agent, key):
                        setattr(agent.agent, key, value)
        
        self.agents[agent.name] = agent
        logger.info(f"Added agent: {agent.name}")
    
    def get_agent(self, name: str) -> Optional[ADKAgent]:
        """Get an agent by name.
        
        Args:
            name: Name of the agent to retrieve
            
        Returns:
            The agent instance if found, None otherwise
        """
        return self.agents.get(name)
    
    async def process_message(
        self,
        agent_name: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """Process a message with the specified agent.
        
        Args:
            agent_name: Name of the agent to use
            message: The message to process
            context: Optional context for the message
            
        Returns:
            AgentResponse containing the agent's response
        """
        """Process a message using the specified agent.
        
        Args:
            agent_name: Name of the agent to use
            context: Optional context dictionary
            
        Returns:
            AgentResponse with the result
        """
        try:
            agent = self.get_agent(agent_name)
            if not agent:
                error_msg = f"Agent '{agent_name}' not found"
                logger.error(error_msg)
                return AgentResponse(
                    success=False,
                    content=error_msg,
                    error=error_msg
                )

            # Let the underlying agent handle context formatting
            logger.info(f"Processing message with agent '{agent_name}': {message[:100]}...")

            # Process the message with the agent and propagate its response
            response = await agent.process_message(message, context)

            # Ensure response is an AgentResponse
            if not isinstance(response, AgentResponse):
                response = AgentResponse(
                    success=bool(response),
                    content=str(response) if response is not None else "",
                    error=None
                )

            # Enrich metadata
            response.metadata = {
                **(response.metadata or {}),
                "agent": agent_name,
                "model": getattr(agent, 'model', 'unknown'),
                "temperature": getattr(agent, 'temperature', 'unknown'),
                "project_id": getattr(agent, 'project_id', 'unknown'),
                "location": getattr(agent, 'location', 'unknown'),
                "timestamp": datetime.utcnow().isoformat()
            }

            # Log concise response content
            content_preview = (response.content[:200] + "...") if isinstance(response.content, str) and len(response.content) > 200 else response.content
            logger.debug(f"Agent '{agent_name}' response (preview): {content_preview}")

            return response

        except Exception as e:
            error_msg = f"Error processing message with agent '{agent_name}': {str(e)}"
            logger.error(error_msg, exc_info=True)
            return AgentResponse(
                success=False,
                content=error_msg,
                error=str(e),
                metadata={
                    "agent": agent_name,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    async def orchestrate(
        self,
        message: str,
        agent_names: Optional[List[str]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, AgentResponse]:
        """Orchestrate multiple agents to process a message.
        
        Args:
            message: The message to process
            agent_names: List of agent names to use (default: all agents)
            context: Optional context dictionary
            
        Returns:
            Dictionary mapping agent names to their responses
        """
        agents_to_use = agent_names if agent_names else list(self.agents.keys())
        results = {}
        
        # Process messages concurrently
        import asyncio
        tasks = []
        for name in agents_to_use:
            if name in self.agents:
                task = asyncio.create_task(
                    self.process_message(name, message, context)
                )
                tasks.append((name, task))
        
        # Wait for all tasks to complete
        for name, task in tasks:
            try:
                results[name] = await task
            except Exception as e:
                logger.error(f"Error in agent {name}: {str(e)}")
                results[name] = AgentResponse(
                    success=False,
                    content=f"Error processing with {name}: {str(e)}",
                    error=str(e)
                )
        
        return results
