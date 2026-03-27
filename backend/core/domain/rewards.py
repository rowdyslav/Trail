from datetime import timedelta
from enum import StrEnum
from secrets import choice


class RouteType(StrEnum):
    """Тип маршрута для начисления награды."""

    FREE = "free"
    PAID = "paid"


class RedemptionCodeStatus(StrEnum):
    """Статусы кода на выдачу награды."""

    ACTIVE = "active"
    USED = "used"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


REDEMPTION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
REDEMPTION_CODE_LENGTH = 6
REDEMPTION_CODE_TTL = timedelta(minutes=20)


def generate_redemption_code(length: int = REDEMPTION_CODE_LENGTH) -> str:
    return "".join(choice(REDEMPTION_CODE_ALPHABET) for _ in range(length))
