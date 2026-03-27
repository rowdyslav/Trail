from __future__ import annotations

from typing import Literal, TypeAlias


AvatarEventType: TypeAlias = Literal[
    "on_scan_success",
    "on_level_up",
    "on_streak",
    "on_app_return",
]

AvatarReactionMap: TypeAlias = dict[AvatarEventType, str]
