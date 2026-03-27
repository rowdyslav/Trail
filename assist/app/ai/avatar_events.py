from __future__ import annotations

from dataclasses import dataclass

from .common import REACTION_STYLE_GUIDE, build_context_prompt, generate_reaction_message
from .deepseek_client import DeepSeekClient


@dataclass(frozen=True)
class AvatarReactionScenario:
    system_description: str
    event_description: str
    generation_instruction: str
    empty_response_error: str
    default_extra_context: str


LEVEL_UP_SCENARIO = AvatarReactionScenario(
    system_description="Ты генерируешь одну короткую реплику аватара-гриба-путешественника для события нового уровня.",
    event_description="Событие: новый уровень. Нужна короткая позитивная реакция на повышение уровня.",
    generation_instruction="Сгенерируй одну короткую реплику именно про действие пользователя.",
    empty_response_error="DeepSeek returned empty level_up reaction",
    default_extra_context="Пользователь получил новый уровень.",
)

STREAK_SCENARIO = AvatarReactionScenario(
    system_description="Ты генерируешь одну короткую реплику аватара-гриба-путешественника для события серии посещений.",
    event_description="Событие: серия. Нужна короткая реакция в духе 'так держать', 'хороший темп', 'продолжай'.",
    generation_instruction="Сгенерируй одну короткую реплику именно про действие пользователя.",
    empty_response_error="DeepSeek returned empty streak reaction",
    default_extra_context="У пользователя серия из нескольких посещений подряд.",
)

APP_RETURN_SCENARIO = AvatarReactionScenario(
    system_description="Ты генерируешь одну короткую реплику аватара-гриба-путешественника для события возврата в приложение.",
    event_description="Событие: пользователь вернулся в приложение. Нужна короткая фраза в духе 'с возвращением' или 'продолжим'.",
    generation_instruction="Сгенерируй одну короткую реплику именно про действие пользователя.",
    empty_response_error="DeepSeek returned empty app_return reaction",
    default_extra_context="Пользователь вернулся в приложение после паузы.",
)


async def generate_avatar_event_message(
    scenario: AvatarReactionScenario,
    extra_context: str | None = None,
    client: DeepSeekClient | None = None,
) -> str:
    system_prompt = f"{scenario.system_description} {REACTION_STYLE_GUIDE}"
    user_prompt = build_context_prompt(
        scenario.event_description,
        scenario.generation_instruction,
        extra_context,
    )
    return await generate_reaction_message(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        empty_error=scenario.empty_response_error,
        client=client,
    )
