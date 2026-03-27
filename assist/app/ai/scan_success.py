from __future__ import annotations

from .deepseek_client import DeepSeekClient
from .facts import generate_fact


async def generate_scan_success_message(
    place_name: str,
    description: str | None = None,
    client: DeepSeekClient | None = None,
) -> str:
    if not place_name or not place_name.strip():
        raise ValueError("place_name is required for on_scan_success")

    return await generate_fact(
        place_name=place_name,
        description=description,
        client=client,
    )
