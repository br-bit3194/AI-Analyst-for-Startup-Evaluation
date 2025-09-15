async def call_llm(system_prompt: str, user_prompt: str, model: str = "gpt-like") -> str:
    # Lightweight stub for local development.
    # Replace this with real integration (OpenAI, Gemini, etc.)
    return f"[LLM stub] Role: {system_prompt} -- Input: {user_prompt[:300]}"


# from openai import AsyncOpenAI
# from app.config import settings

# client = AsyncOpenAI(api_key=settings.openai_api_key)

# async def call_llm(system_prompt: str, user_prompt: str, model: str = "gpt-4o-mini") -> str:
#     resp = await client.chat.completions.create(
#         model=model,
#         messages=[
#             {"role": "system", "content": system_prompt},
#             {"role": "user", "content": user_prompt},
#         ]
#     )
#     return resp.choices[0].message.content