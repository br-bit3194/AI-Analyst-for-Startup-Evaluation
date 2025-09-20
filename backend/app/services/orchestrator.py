from app.models import DebateSession, AgentMessage, AgentModel
from app.services.llm_client import call_llm
from datetime import datetime

async def start_session(topic: str, agent_definitions: list):
    session = DebateSession(topic=topic, agents=[AgentModel(**a) for a in agent_definitions])
    await session.insert()
    return session

async def run_next_round(session_id: str):
    session = await DebateSession.get(session_id)
    if not session:
        raise ValueError("Session not found")
    idx = session.rounds % len(session.agents)
    agent = session.agents[idx]
    # build simple context from last messages
    context_parts = []
    for a in session.agents:
        for m in a.messages[-5:]:
            context_parts.append(f"{m.agent_name}: {m.text}")
    context = "\n".join(context_parts)
    prompt = f"Topic: {session.topic}\nContext:\n{context}\n\n{agent.role}\nRespond concisely:"
    reply = await call_llm(system_prompt=agent.role, user_prompt=prompt)
    msg = AgentMessage(agent_name=agent.name, role=agent.role, text=reply, created_at=datetime.utcnow())
    session.agents[idx].messages.append(msg)
    session.rounds += 1
    await session.save()
    return reply
