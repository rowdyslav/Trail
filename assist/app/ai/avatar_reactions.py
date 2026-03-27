from __future__ import annotations

from collections.abc import Awaitable, Callable

from .app_return import generate_app_return_message
from .avatar_events import APP_RETURN_SCENARIO, LEVEL_UP_SCENARIO, STREAK_SCENARIO
from .deepseek_client import DeepSeekClient
from .level_up import generate_level_up_message
from .scan_success import generate_scan_success_message
from .streak import generate_streak_message
from .types import AvatarEventType, AvatarReactionMap


AvatarReactionGenerator = Callable[
    [str | None, str | None, str | None, DeepSeekClient | None],
    Awaitable[str],
]

SCAN_SUCCESS_EVENT: AvatarEventType = "on_scan_success"
SUPPORTED_AVATAR_EVENTS: tuple[AvatarEventType, ...] = (
    SCAN_SUCCESS_EVENT,
    "on_level_up",
    "on_streak",
    "on_app_return",
)


async def _generate_scan_success_reaction(
    place_name: str | None,
    description: str | None,
    _extra_context: str | None,
    client: DeepSeekClient | None,
) -> str:
    if not place_name or not place_name.strip():
        raise ValueError("place_name is required for on_scan_success")

    return await generate_scan_success_message(
        place_name=place_name,
        description=description,
        client=client,
    )


async def _generate_level_up_reaction(
    _place_name: str | None,
    _description: str | None,
    extra_context: str | None,
    client: DeepSeekClient | None,
) -> str:
    return await generate_level_up_message(extra_context=extra_context, client=client)


async def _generate_streak_reaction(
    _place_name: str | None,
    _description: str | None,
    extra_context: str | None,
    client: DeepSeekClient | None,
) -> str:
    return await generate_streak_message(extra_context=extra_context, client=client)


async def _generate_app_return_reaction(
    _place_name: str | None,
    _description: str | None,
    extra_context: str | None,
    client: DeepSeekClient | None,
) -> str:
    return await generate_app_return_message(extra_context=extra_context, client=client)


EVENT_REACTION_GENERATORS: dict[AvatarEventType, AvatarReactionGenerator] = {
    SCAN_SUCCESS_EVENT: _generate_scan_success_reaction,
    "on_level_up": _generate_level_up_reaction,
    "on_streak": _generate_streak_reaction,
    "on_app_return": _generate_app_return_reaction,
}

DEFAULT_EVENT_CONTEXTS: dict[AvatarEventType, str] = {
    SCAN_SUCCESS_EVENT: "Пользователь только что успешно отсканировал точку маршрута.",
    "on_level_up": LEVEL_UP_SCENARIO.default_extra_context,
    "on_streak": STREAK_SCENARIO.default_extra_context,
    "on_app_return": APP_RETURN_SCENARIO.default_extra_context,
}


async def generate_avatar_reaction(
    event_type: AvatarEventType,
    place_name: str | None = None,
    description: str | None = None,
    extra_context: str | None = None,
    client: DeepSeekClient | None = None,
) -> str:
    reaction_generator = EVENT_REACTION_GENERATORS.get(event_type)
    if reaction_generator is None:
        raise ValueError(f"Unsupported avatar event: {event_type}")

    return await reaction_generator(place_name, description, extra_context, client)


async def generate_avatar_reactions(
    place_name: str | None = None,
    description: str | None = None,
    client: DeepSeekClient | None = None,
) -> AvatarReactionMap:
    reactions: dict[str, str] = {}

    for event_type in SUPPORTED_AVATAR_EVENTS:
        reactions[event_type] = await generate_avatar_reaction(
            event_type,
            place_name=place_name,
            description=description,
            extra_context=DEFAULT_EVENT_CONTEXTS[event_type],
            client=client,
        )

    return AvatarReactionMap(
        on_scan_success=reactions["on_scan_success"],
        on_level_up=reactions["on_level_up"],
        on_streak=reactions["on_streak"],
        on_app_return=reactions["on_app_return"],
    )
