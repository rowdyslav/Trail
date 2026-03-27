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
