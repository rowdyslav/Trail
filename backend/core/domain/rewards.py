from enum import StrEnum
from secrets import choice


class RouteType(StrEnum):
    """Тип маршрута для начисления награды."""

    FREE = "free"
    PAID = "paid"


class CodeStatus(StrEnum):
    """Статусы кода на выдачу награды."""

    ACTIVE = "active"
    USED = "used"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6


def generate_code(length: int = CODE_LENGTH) -> str:
    return "".join(choice(CODE_ALPHABET) for _ in range(length))
