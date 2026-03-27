from __future__ import annotations

import asyncio

from .common import normalize_text
from .deepseek_client import DeepSeekClient
from ..config import get_settings


def _fact_system_prompt() -> str:
    return (
        "Ты пишешь компактную, но содержательную информацию о месте для туриста после сканирования QR-кода. "
        "Пиши только по-русски, обычно 2-3 предложения, живо, интересно, но без занудства. "
        "Текст должен кратко объяснять, что это за место, по возможности упоминать период постройки, основания "
        "или исторического появления, и добавлять один интересный факт, если ты в нем уверен. "
        "Не добавляй списки, markdown, кавычки и служебные пояснения. "
        "Не выдумывай сомнительные исторические детали, легенды, даты, клады, имена или редкие подробности, если ты не уверен. "
        "Если точных сведений мало, дай осторожную, правдоподобную и общую информацию о месте без вымышленных деталей."
    )


def _fact_user_prompt(place_name: str, description: str | None = None) -> str:
    description_block = f"Краткое описание: {description.strip()}\n" if description and description.strip() else ""
    return (
        f"Название точки: {place_name.strip()}\n"
        f"{description_block}"
        "Сделай текст естественным и легко читаемым. "
        "Если знаешь точную эпоху, век или дату основания/строительства, аккуратно укажи это."
    )


def _fallback_from_description(description: str | None) -> str | None:
    if not description or not description.strip():
        return None
    return normalize_text(description)


async def generate_fact(
    place_name: str,
    description: str | None = None,
    client: DeepSeekClient | None = None,
) -> str:
    if not place_name or not place_name.strip():
        raise ValueError("place_name is required")

    deepseek = client or DeepSeekClient()
    fallback = _fallback_from_description(description)

    if not deepseek.is_configured():
        if fallback:
            return fallback
        raise RuntimeError("DeepSeek is not configured")

    settings = get_settings()
    try:
        text = await deepseek.generate_text(
            _fact_system_prompt(),
            _fact_user_prompt(place_name, description),
            timeout=settings.deepseek_timeout_seconds,
        )
    except Exception:
        if fallback:
            return fallback
        raise

    cleaned = normalize_text(text)
    if not cleaned:
        if fallback:
            return fallback
        raise ValueError("DeepSeek returned empty fact")
    return cleaned


def generate_fact_in_background(
    place_name: str,
    description: str | None = None,
    client: DeepSeekClient | None = None,
) -> "asyncio.Task[str]":
    return asyncio.create_task(generate_fact(place_name, description, client))
