from __future__ import annotations

from .avatar_events import LEVEL_UP_SCENARIO, generate_avatar_event_message
from .deepseek_client import DeepSeekClient


async def generate_level_up_message(
    extra_context: str | None = None,
    client: DeepSeekClient | None = None,
) -> str:
    return await generate_avatar_event_message(LEVEL_UP_SCENARIO, extra_context, client)
