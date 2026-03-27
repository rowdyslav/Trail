from datetime import UTC, datetime
from enum import StrEnum


class StreakKey(StrEnum):
    """Ключи цепочки прогрессии серии."""

    NOVICE = "novice"
    EXPLORER = "explorer"
    TRAVELER = "traveler"
    PATHFINDER = "pathfinder"
    LEGEND = "legend"


STREAK_KEY_CHAIN: tuple[StreakKey, ...] = (
    StreakKey.NOVICE,
    StreakKey.EXPLORER,
    StreakKey.TRAVELER,
    StreakKey.PATHFINDER,
    StreakKey.LEGEND,
)


def calculate_streak_level(streak_days: int) -> int:
    if streak_days <= 0:
        return 1
    return min(len(STREAK_KEY_CHAIN), ((streak_days - 1) // 3) + 1)


def calculate_streak_key(streak_days: int) -> StreakKey:
    return STREAK_KEY_CHAIN[calculate_streak_level(streak_days) - 1]


def calculate_streak_days(
    current_streak_days: int,
    last_completed_at: datetime | None,
    now: datetime,
) -> int:
    if last_completed_at is None:
        return 1

    last_completed_date = last_completed_at.astimezone(UTC).date()
    current_date = now.astimezone(UTC).date()
    days_diff = (current_date - last_completed_date).days

    if days_diff <= 0:
        return current_streak_days
    if days_diff == 1:
        return current_streak_days + 1 if current_streak_days > 0 else 1
    return 1
