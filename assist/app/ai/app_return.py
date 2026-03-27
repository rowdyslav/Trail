from __future__ import annotations

from .avatar_events import APP_RETURN_SCENARIO, generate_avatar_event_message
from .deepseek_client import DeepSeekClient


async def generate_app_return_message(
    extra_context: str | None = None,
    client: DeepSeekClient | None = None,
) -> str:
    return await generate_avatar_event_message(APP_RETURN_SCENARIO, extra_context, client)
