from __future__ import annotations

from typing import Final

from .deepseek_client import DeepSeekClient
from ..config import get_settings


REACTION_STYLE_GUIDE: Final[str] = (
    "Пиши только по-русски. Реплика должна коротко поддерживать пользователя. "
    "Без фактов о месте, без длинных образов. "
    "Стиль живой, уверенный, не кринжовый, не детский, максимум одно предложение."
)


def normalize_text(value: str) -> str:
    return " ".join(value.split())


def build_context_prompt(base_event: str, action_note: str, extra_context: str | None = None) -> str:
    prompt_parts = [base_event]
    if extra_context and extra_context.strip():
        prompt_parts.append(f"Контекст: {extra_context.strip()}")
    prompt_parts.append(action_note)
    return "\n".join(prompt_parts)


def ensure_client(client: DeepSeekClient | None = None) -> DeepSeekClient:
    deepseek = client or DeepSeekClient()
    if not deepseek.is_configured():
        raise RuntimeError("DeepSeek is not configured")
    return deepseek


async def generate_reaction_message(
    *,
    system_prompt: str,
    user_prompt: str,
    empty_error: str,
    client: DeepSeekClient | None = None,
) -> str:
    deepseek = ensure_client(client)
    text = await deepseek.generate_text(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        timeout=get_settings().deepseek_timeout_seconds,
    )
    cleaned = normalize_text(text)
    if not cleaned:
        raise ValueError(empty_error)
    return cleaned
