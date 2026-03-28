from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable

from .client import DeepSeekClient
from .dataset import get_place_description
from .prompts import (
    APP_RETURN_SCENARIO,
    FACT_SYSTEM_PROMPT,
    LEVEL_UP_SCENARIO,
    REACTION_STYLE_GUIDE,
    ROUTE_COMPLETION_SCENARIO,
    SCAN_SUCCESS_SCENARIO,
    STREAK_SCENARIO,
)
from .types import AssistantEventType, AssistantScenario, AvatarReactionMap

AvatarReactionGenerator = Callable[
    [str | None, str | None, str | None],
    Awaitable[str],
]


def normalize_text(value: str) -> str:
    return " ".join(value.split())


def build_context_prompt(
    base_event: str,
    action_note: str,
    extra_context: str | None = None,
) -> str:
    prompt_parts = [base_event]
    if extra_context and extra_context.strip():
        prompt_parts.append(f"Контекст: {extra_context.strip()}")
    prompt_parts.append(action_note)
    return "\n".join(prompt_parts)


class DeepSeekService:
    def __init__(self, client: DeepSeekClient | None = None) -> None:
        self.client = client or DeepSeekClient()

    def is_configured(self) -> bool:
        return self.client.is_configured()

    async def generate_fact(
        self,
        *,
        place_name: str,
        description: str | None = None,
    ) -> str:
        if not place_name or not place_name.strip():
            message = "place_name is required"
            raise ValueError(message)

        effective_description = description or get_place_description(place_name)
        fallback = self._fallback_from_description(effective_description)

        if not self.is_configured():
            if fallback:
                return fallback
            message = "DeepSeek is not configured"
            raise RuntimeError(message)

        try:
            text = await self.client.generate_text(
                system_prompt=FACT_SYSTEM_PROMPT,
                user_prompt=self._build_fact_user_prompt(
                    place_name=place_name,
                    description=effective_description,
                ),
            )
        except Exception:
            if fallback:
                return fallback
            raise

        cleaned = normalize_text(text)
        if cleaned:
            return cleaned
        if fallback:
            return fallback
        message = "DeepSeek returned empty fact"
        raise ValueError(message)

    def generate_fact_in_background(
        self,
        *,
        place_name: str,
        description: str | None = None,
    ) -> asyncio.Task[str]:
        """NOT_IMPLMNT: reserved helper, currently unused in app flows."""
        return asyncio.create_task(
            self.generate_fact(place_name=place_name, description=description)
        )

    async def generate_scan_success_message(
        self,
        *,
        place_name: str,
        description: str | None = None,
    ) -> str:
        return await self.generate_fact(
            place_name=place_name,
            description=description,
        )

    async def generate_route_completion_message(
        self,
        *,
        extra_context: str | None = None,
    ) -> str:
        return await self._generate_event_message(
            ROUTE_COMPLETION_SCENARIO,
            extra_context=extra_context,
        )

    async def generate_level_up_message(
        self,
        *,
        extra_context: str | None = None,
    ) -> str:
        return await self._generate_event_message(
            LEVEL_UP_SCENARIO,
            extra_context=extra_context,
        )

    async def generate_streak_message(
        self,
        *,
        extra_context: str | None = None,
    ) -> str:
        return await self._generate_event_message(
            STREAK_SCENARIO,
            extra_context=extra_context,
        )

    async def generate_app_return_message(
        self,
        *,
        extra_context: str | None = None,
    ) -> str:
        """NOT_IMPLMNT: reserved helper, currently unused in app flows."""
        return await self._generate_event_message(
            APP_RETURN_SCENARIO,
            extra_context=extra_context,
        )

    async def generate_avatar_reaction(
        self,
        *,
        event_type: AssistantEventType,
        place_name: str | None = None,
        description: str | None = None,
        extra_context: str | None = None,
    ) -> str:
        generators: dict[AssistantEventType, AvatarReactionGenerator] = {
            "on_scan_success": self._generate_scan_success_reaction,
            "on_level_up": self._generate_level_up_reaction,
            "on_streak": self._generate_streak_reaction,
            "on_app_return": self._generate_app_return_reaction,
        }
        generator = generators.get(event_type)
        if generator is None:
            raise ValueError(f"Unsupported avatar event: {event_type}")
        return await generator(place_name, description, extra_context)

    async def generate_avatar_reactions(
        self,
        *,
        place_name: str | None = None,
        description: str | None = None,
    ) -> AvatarReactionMap:
        """NOT_IMPLMNT: reserved helper, currently unused in app flows."""
        return AvatarReactionMap(
            on_scan_success=await self.generate_avatar_reaction(
                event_type="on_scan_success",
                place_name=place_name,
                description=description,
                extra_context=SCAN_SUCCESS_SCENARIO.default_extra_context,
            ),
            on_level_up=await self.generate_avatar_reaction(
                event_type="on_level_up",
                place_name=place_name,
                description=description,
                extra_context=LEVEL_UP_SCENARIO.default_extra_context,
            ),
            on_streak=await self.generate_avatar_reaction(
                event_type="on_streak",
                place_name=place_name,
                description=description,
                extra_context=STREAK_SCENARIO.default_extra_context,
            ),
            on_app_return=await self.generate_avatar_reaction(
                event_type="on_app_return",
                place_name=place_name,
                description=description,
                extra_context=APP_RETURN_SCENARIO.default_extra_context,
            ),
        )

    async def _generate_scan_success_reaction(
        self,
        place_name: str | None,
        description: str | None,
        extra_context: str | None,
    ) -> str:
        if not place_name or not place_name.strip():
            message = "place_name is required for on_scan_success"
            raise ValueError(message)
        reaction_context = (
            f"{extra_context.strip()} Точка: {place_name.strip()}."
            if extra_context and extra_context.strip()
            else f"Точка: {place_name.strip()}."
        )
        if description and description.strip():
            route_context = f"Контекст маршрута: {description.strip()}."
            reaction_context = f"{reaction_context} {route_context}"
        return await self._generate_event_message(
            SCAN_SUCCESS_SCENARIO,
            extra_context=reaction_context,
        )

    async def _generate_level_up_reaction(
        self,
        _place_name: str | None,
        _description: str | None,
        extra_context: str | None,
    ) -> str:
        return await self.generate_level_up_message(extra_context=extra_context)

    async def _generate_streak_reaction(
        self,
        _place_name: str | None,
        _description: str | None,
        extra_context: str | None,
    ) -> str:
        return await self.generate_streak_message(extra_context=extra_context)

    async def _generate_app_return_reaction(
        self,
        _place_name: str | None,
        _description: str | None,
        extra_context: str | None,
    ) -> str:
        return await self.generate_app_return_message(extra_context=extra_context)

    async def _generate_event_message(
        self,
        scenario: AssistantScenario,
        *,
        extra_context: str | None,
    ) -> str:
        if not self.is_configured():
            message = "DeepSeek is not configured"
            raise RuntimeError(message)

        text = await self.client.generate_text(
            system_prompt=f"{scenario.system_description} {REACTION_STYLE_GUIDE}",
            user_prompt=build_context_prompt(
                scenario.event_description,
                scenario.generation_instruction,
                extra_context,
            ),
        )
        cleaned = normalize_text(text)
        if not cleaned:
            raise ValueError(scenario.empty_response_error)
        return cleaned

    @staticmethod
    def _build_fact_user_prompt(
        *,
        place_name: str,
        description: str | None = None,
    ) -> str:
        description_block = ""
        if description and description.strip():
            description_block = f"Краткое описание: {description.strip()}\n"
        return (
            f"Название точки: {place_name.strip()}\n"
            f"{description_block}"
            "Сделай текст естественным и легко читаемым. "
            "Если знаешь точную эпоху, век или дату "
            "основания/строительства, аккуратно укажи это."
        )

    @staticmethod
    def _fallback_from_description(description: str | None) -> str | None:
        if not description or not description.strip():
            return None
        return normalize_text(description)
