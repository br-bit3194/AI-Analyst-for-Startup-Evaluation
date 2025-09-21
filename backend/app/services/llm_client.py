import asyncio
from app.config import settings

try:
    import google.generativeai as genai
except Exception:
    genai = None

async def call_llm(system_prompt: str, user_prompt: str, model: str = "gpt-like") -> str:
    """
    Unified LLM call. If LLM_PROVIDER=gemini and GEMINI_API_KEY is set, use Gemini.
    Otherwise return a lightweight stub for local development.
    """
    if settings.LLM_PROVIDER.lower() == "gemini" and settings.GEMINI_API_KEY and genai is not None:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_name = model or "gemini-1.5-flash"
        sys_prefix = system_prompt or ""

        def _invoke():
            m = genai.GenerativeModel(model_name)
            # Concatenate system prompt and user prompt into a single input
            prompt = f"System: {sys_prefix}\n\n{user_prompt}"
            resp = m.generate_content(prompt)
            return resp.text if hasattr(resp, "text") else str(resp)

        try:
            response = await asyncio.to_thread(_invoke)
            print(f"DEBUG: Gemini API response: {response[:500]}...")  # Debug logging
            return response
        except Exception as e:
            print(f"DEBUG: Gemini API error: {e}")  # Debug logging
            return f"[LLM error: {e}]"

    # Fallback stub - return a properly formatted JSON response
    print("DEBUG: Using fallback response (Gemini API not configured)")  # Debug logging

    # Fallback stub - return a properly formatted JSON response
    fallback_response = {
        "verdict": "CONSIDER",
        "confidence": 75.0,
        "key_metrics": {
            "market_size": "Not evaluated in fallback mode",
            "revenue": "Not evaluated in fallback mode",
            "growth_rate": "Not evaluated in fallback mode",
            "team_strength": "Not evaluated in fallback mode"
        },
        "risks": [
            "API key not configured - using fallback mode",
            "Analysis is not based on actual AI evaluation"
        ],
        "opportunities": [
            "Enable Gemini API for comprehensive analysis",
            "Get real investment recommendations"
        ],
        "recommendations": [
            "Configure GEMINI_API_KEY in .env file",
            "Set LLM_PROVIDER=gemini",
            "Restart the backend server"
        ]
    }
    
    import json
    return json.dumps(fallback_response)