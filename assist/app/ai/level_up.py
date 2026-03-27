from __future__ import annotations

from app.ai.common import REACTION_STYLE_GUIDE, build_context_prompt, generate_reaction_message
from app.ai.deepseek_client import DeepSeekClient


def _level_up_system_prompt() -> str:
    return (
        "Ты генерируешь одну короткую реплику аватара-гриба-путешественника для события нового уровня. "
        f"{REACTION_STYLE_GUIDE}"
    )


def _level_up_user_prompt(extra_context: str | None = None) -> str:
    return build_context_prompt(
        "Событие: новый уровень. Нужна короткая позитивная реакция на повышение уровня.",
        "Сгенерируй одну короткую реплику именно про действие пользователя.",
        extra_context,
    )


async def generate_level_up_message(
    extra_context: str | None = None,
    client: DeepSeekClient | None = None,
) -> str:
    return await generate_reaction_message(
        system_prompt=_level_up_system_prompt(),
        user_prompt=_level_up_user_prompt(extra_context),
        empty_error="DeepSeek returned empty level_up reaction",
        client=client,
    )
