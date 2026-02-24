import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger("ai_orchestrator.agents")


class BaseAgent(ABC):
    """
    Abstract base class for all AI agents in the orchestrator.

    Subclasses must implement:
        - agent_name: A unique identifier for the agent.
        - run(): The main execution method for the agent's task.
    """

    @property
    @abstractmethod
    def agent_name(self) -> str:
        """Unique name identifying this agent."""
        ...

    @abstractmethod
    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """
        Execute the agent's primary task.

        Args:
            input_data: A dictionary containing the input parameters for the agent.

        Returns:
            A dictionary containing the agent's output/results.
        """
        ...

    async def emit_event(
        self,
        event_type: str,
        data: dict[str, Any],
        execution_id: str | None = None,
    ) -> None:
        """
        Publish an A2A (Agent-to-Agent) event.

        This is a stub for inter-agent communication. In production, this will
        publish events to Redis pub/sub or a message broker so other agents
        and the realtime service can react to agent activity.

        Args:
            event_type: The type of event (e.g., 'thinking', 'tool_call', 'output', 'error').
            data: The event payload.
            execution_id: Optional execution ID for tracking the agent run.
        """
        logger.info(
            "Agent '%s' emitting event [%s] (execution_id=%s): %s",
            self.agent_name,
            event_type,
            execution_id,
            data,
        )
        # TODO: Publish to Redis pub/sub or message broker
        # Example:
        #   await redis_client.publish(f"agent:{execution_id}", json.dumps({
        #       "agent_name": self.agent_name,
        #       "event_type": event_type,
        #       "data": data,
        #   }))
