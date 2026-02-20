import httpx
from fastapi import HTTPException

from app.core.config import settings


async def call_agent(agent_id: str, content: str, timeout_seconds: float = 300.0) -> dict:
    payload = {
        'agent_id': agent_id,
        'messages': [
            {
                'role': 'user',
                'content': content,
            }
        ],
    }
    headers = {
        'Authorization': f'Bearer {settings.MISTRAL_API_KEY}',
        'Content-Type': 'application/json',
    }
    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(settings.MISTRAL_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail='Mistral request timed out') from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f'Mistral API error: {exc.response.text}') from exc
