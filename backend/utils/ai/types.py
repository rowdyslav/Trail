from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, TypedDict, TypeAlias


AssistantEventType: TypeAlias = Literal[
    "on_scan_success",
    "on_level_up",
    "on_streak",
    "on_app_return",
]


class AvatarReactionMap(TypedDict):
    on_scan_success: str
    on_level_up: str
    on_streak: str
    on_app_return: str


class PlaceRecord(TypedDict):
    id: int
    place_name: str
    description: str


@dataclass(frozen=True)
class AssistantScenario:
    system_description: str
    event_description: str
    generation_instruction: str
    empty_response_error: str
    default_extra_context: str
