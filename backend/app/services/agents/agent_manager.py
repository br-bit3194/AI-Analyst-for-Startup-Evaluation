"""
Agent Manager for handling multi-agent orchestration using Google's Agent Builder.
"""
import os
from typing import Dict, List, Optional, Any
from google.cloud import aiplatform
from google.cloud.aiplatform import base
from google.cloud.aiplatform import initializer
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

# Initialize Vertex AI
aiplatform.init()

class AgentConfig(BaseModel):
    """Configuration for an individual agent."""
    name: str
    description: str
    instructions: str
    tools: List[Dict[str, Any]] = Field(default_factory=list)
    model: str = "gemini-1.5-pro"  # Updated to a valid model name
    temperature: float = 0.2
    project: str = "your-project-id"  # Will be overridden
    location: str = "us-central1"    # Will be overridden

class AgentResponse(BaseModel):
    """Standardized response format for agent interactions."""
    success: bool
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None

class AgentManager:
    """Manages multiple agents using Google's Agent Builder."""
    
    def __init__(self, project_id: str, location: str):
        """Initialize the AgentManager with Google Cloud project and location."""
        self.project_id = project_id or os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = location or os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.agents: Dict[str, Any] = {}
        self.initialized = False
        
        if not self.project_id:
            raise ValueError("Google Cloud Project ID must be provided or set in GOOGLE_CLOUD_PROJECT environment variable")
            
        # Initialize the AI Platform
        aiplatform.init(project=self.project_id, location=self.location)
        
    async def initialize_agents(self, agent_configs: List[AgentConfig]):
        """Initialize multiple agents from configurations."""
        try:
            for config in agent_configs:
                # Override project/location from manager if not set in config
                if not hasattr(config, 'project') or not config.project:
                    config.project = self.project_id
                if not hasattr(config, 'location') or not config.location:
                    config.location = self.location
                    
                await self._create_agent(config)
                
            self.initialized = True
            logger.info(f"Successfully initialized {len(agent_configs)} agents")
        except Exception as e:
            logger.error(f"Failed to initialize agents: {str(e)}")
            raise
    
    async def _create_agent(self, config: AgentConfig):
        """Create a new agent using Google's Agent Builder."""
        try:
            # Create a simple agent configuration
            agent_info = {
                "name": config.name,
                "description": config.description,
                "model": config.model,
                "temperature": config.temperature,
                "tools": config.tools or []
            }
            
            # Store the agent configuration
            self.agents[config.name] = {
                "config": config,
                "agent_info": agent_info
            }
            logger.info(f"Configured agent: {config.name}")
            
        except Exception as e:
            logger.error(f"Error creating agent {config.name}: {str(e)}")
            raise
    
    async def process_message(
        self, 
        agent_name: str, 
        message: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """Process a message using the specified agent."""
        if not self.initialized:
            return AgentResponse(
                success=False,
                content="Agent manager not initialized",
                error="Agent manager not initialized"
            )
            
        if agent_name not in self.agents:
            return AgentResponse(
                success=False,
                content=f"Agent {agent_name} not found",
                error=f"Agent {agent_name} not found"
            )
            
        try:
            agent_info = self.agents[agent_name]
            config = agent_info["config"]
            
            # Initialize the model
            model = aiplatform.GenerativeModel(
                model_name=config.model,
                project=config.project,
                location=config.location
            )
            
            # Prepare the prompt with context if provided
            prompt_parts = []
            if context:
                context_str = '\n'.join([f"{k}: {v}" for k, v in context.items()])
                prompt_parts.append(f"Context:\n{context_str}")
            
            prompt_parts.append(f"Instructions: {config.instructions}")
            prompt_parts.append(f"Question: {message}")
            
            # Generate content
            response = await model.generate_content_async(
                contents=prompt_parts,
                generation_config={
                    "temperature": config.temperature,
                    "max_output_tokens": 1024,
                    "top_p": 0.8,
                    "top_k": 40
                }
            )
            
            # Extract the response content
            if response.text:
                return AgentResponse(
                    success=True,
                    content=response.text,
                    metadata={
                        "model": config.model,
                        "agent": agent_name,
                        "safety_ratings": [
                            {
                                "category": category.name,
                                "probability": category.result.name
                            }
                            for category in response.safety_ratings
                        ] if hasattr(response, 'safety_ratings') else []
                    }
                )
            else:
                raise ValueError("No response generated from the model")
            
        except Exception as e:
            logger.error(f"Error processing message with {agent_name}: {str(e)}")
            return AgentResponse(
                success=False,
                content=f"Error processing message: {str(e)}",
                error=str(e)
            )
    
    async def orchestrate_agents(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        agent_names: Optional[List[str]] = None
    ) -> Dict[str, AgentResponse]:
        """
        Orchestrate multiple agents to process a message.
        
        Args:
            message: The message to process
            context: Optional context dictionary
            agent_names: Optional list of agent names to use (default: all agents)
            
        Returns:
            Dictionary mapping agent names to their responses
        """
        if not self.initialized:
            return {
                "error": AgentResponse(
                    success=False,
                    content="Agent manager not initialized",
                    error="Agent manager not initialized"
                )
            }
            
        results = {}
        agents_to_use = agent_names if agent_names else list(self.agents.keys())
        
        # Process messages concurrently
        import asyncio
        tasks = []
        for agent_name in agents_to_use:
            if agent_name in self.agents:
                task = asyncio.create_task(
                    self.process_message(agent_name, message, context)
                )
                tasks.append((agent_name, task))
        
        # Wait for all tasks to complete
        for agent_name, task in tasks:
            try:
                results[agent_name] = await task
            except Exception as e:
                logger.error(f"Error in agent {agent_name}: {str(e)}")
                results[agent_name] = AgentResponse(
                    success=False,
                    content=f"Error processing with {agent_name}: {str(e)}",
                    error=str(e)
                )
            
        return results
