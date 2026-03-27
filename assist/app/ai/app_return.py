from __future__ import annotations

from .common import REACTION_STYLE_GUIDE, build_context_prompt, generate_reaction_message
from .deepseek_client import DeepSeekClient


def _app_return_system_prompt() -> str:
    return (
        "Ты генерируешь одну короткую реплику аватара-гриба-путешественника для события возврата в приложение. "
        f"{REACTION_STYLE_GUIDE}"
    )


def _app_return_user_prompt(extra_context: str | None = None) -> str:
    return build_context_prompt(
        "Событие: пользователь вернулся в приложение. Нужна короткая фраза в духе 'с возвращением' или 'продолжим'.",
        "Сгенерируй одну короткую реплику именно про действие пользователя.",
        extra_context,
    )


async def generate_app_return_message(
    extra_context: str | None = None,
    client: DeepSeekClient | None = None,
) -> str:
    return await generate_reaction_message(
        system_prompt=_app_return_system_prompt(),
        user_prompt=_app_return_user_prompt(extra_context),
        empty_error="DeepSeek returned empty app_return reaction",
        client=client,
    )
