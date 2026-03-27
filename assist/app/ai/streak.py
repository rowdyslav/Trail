from __future__ import annotations

from app.ai.common import REACTION_STYLE_GUIDE, build_context_prompt, generate_reaction_message
from app.ai.deepseek_client import DeepSeekClient


def _streak_system_prompt() -> str:
    return (
        "Ты генерируешь одну короткую реплику аватара-гриба-путешественника для события серии посещений. "
        f"{REACTION_STYLE_GUIDE}"
    )


def _streak_user_prompt(extra_context: str | None = None) -> str:
    return build_context_prompt(
        "Событие: серия. Нужна короткая реакция в духе 'так держать', 'хороший темп', 'продолжай'.",
        "Сгенерируй одну короткую реплику именно про действие пользователя.",
        extra_context,
    )


async def generate_streak_message(
    extra_context: str | None = None,
    client: DeepSeekClient | None = None,
) -> str:
    return await generate_reaction_message(
        system_prompt=_streak_system_prompt(),
        user_prompt=_streak_user_prompt(extra_context),
        empty_error="DeepSeek returned empty streak reaction",
        client=client,
    )
