from typing import Optional

from app.ai.deepseek_client import DeepSeekClient
from app.ai.facts import generate_fact


async def generate_scan_success_message(
    place_name: str,
    description: Optional[str] = None,
    client: Optional[DeepSeekClient] = None,
) -> str:
    if not place_name or not place_name.strip():
        raise ValueError("place_name is required for on_scan_success")

    return await generate_fact(
        place_name=place_name,
        description=description,
        client=client,
    )
