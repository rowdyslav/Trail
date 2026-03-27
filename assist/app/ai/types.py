from __future__ import annotations

from typing import Literal, TypedDict


AvatarEventType = Literal[
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
