from typing import Optional

from app.ai.deepseek_client import DeepSeekClient
from app.ai.app_return import generate_app_return_message
from app.ai.level_up import generate_level_up_message
from app.ai.scan_success import generate_scan_success_message
from app.ai.streak import generate_streak_message


SCAN_EVENT = "on_scan_success"


async def generate_avatar_reaction(
    event_type: str,
    place_name: Optional[str] = None,
    description: Optional[str] = None,
    extra_context: Optional[str] = None,
    client: Optional[DeepSeekClient] = None,
) -> str:
    if event_type == SCAN_EVENT:
        return await generate_scan_success_message(
            place_name=place_name,
            description=description,
            client=client,
        )
    if event_type == "on_level_up":
        return await generate_level_up_message(extra_context=extra_context, client=client)
    if event_type == "on_streak":
        return await generate_streak_message(extra_context=extra_context, client=client)
    if event_type == "on_app_return":
        return await generate_app_return_message(extra_context=extra_context, client=client)
    raise ValueError(f"Unsupported event_type: {event_type}")


async def generate_avatar_reactions(
    place_name: Optional[str] = None,
    description: Optional[str] = None,
    client: Optional[DeepSeekClient] = None,
) -> dict[str, str]:
    return {
        "on_scan_success": await generate_avatar_reaction(
            "on_scan_success",
            place_name=place_name,
            description=description,
            extra_context="Пользователь только что успешно отсканировал точку маршрута.",
            client=client,
        ),
        "on_level_up": await generate_avatar_reaction(
            "on_level_up",
            extra_context="Пользователь получил новый уровень.",
            client=client,
        ),
        "on_streak": await generate_avatar_reaction(
            "on_streak",
            extra_context="У пользователя серия из нескольких посещений подряд.",
            client=client,
        ),
        "on_app_return": await generate_avatar_reaction(
            "on_app_return",
            extra_context="Пользователь вернулся в приложение после паузы.",
            client=client,
        ),
    }
