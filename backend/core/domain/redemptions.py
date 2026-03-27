from datetime import UTC, datetime

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from core.api.errors import (
    redemption_code_generation_error,
    redemption_code_not_found_error,
)
from core.domain.rewards import (
    REDEMPTION_CODE_TTL,
    RedemptionCodeStatus,
    generate_redemption_code,
)
from core.domain.shared import RedemptionContext
from core.models import RedemptionCode


def build_redemption_expires_at(now: datetime | None = None) -> datetime:
    """Возвращает время истечения срока действия кода."""
    return (now or datetime.now(UTC)) + REDEMPTION_CODE_TTL


async def create_unique_redemption_code(
    user_id: PydanticObjectId,
    requested_points: int,
    context: RedemptionContext,
) -> RedemptionCode:
    """Создает уникальный код списания с ограниченным числом попыток."""
    expires_at = build_redemption_expires_at()

    for _ in range(10):
        try:
            return await RedemptionCode(
                user_id=user_id,
                code=generate_redemption_code(),
                requested_points=requested_points,
                context=context,
                expires_at=expires_at,
            ).insert()
        except DuplicateKeyError:
            continue

    raise redemption_code_generation_error


async def get_redemption_or_404(code: str) -> RedemptionCode:
    """Возвращает код списания по строковому значению."""
    redemption = await RedemptionCode.find_one(RedemptionCode.code == code)
    if redemption is None:
        raise redemption_code_not_found_error
    return redemption


async def get_user_redemption_or_404(
    user_id: PydanticObjectId, code: str
) -> RedemptionCode:
    """Возвращает код списания конкретного пользователя."""
    redemption = await RedemptionCode.find_one(
        RedemptionCode.code == code,
        RedemptionCode.user_id == user_id,
    )
    if redemption is None:
        raise redemption_code_not_found_error
    return redemption


async def sync_redemption_status(
    redemption: RedemptionCode, now: datetime | None = None
) -> RedemptionCode:
    """Синхронизирует статус кода, если срок действия истек."""
    current_time = now or datetime.now(UTC)
    if (
        redemption.status == RedemptionCodeStatus.ACTIVE
        and redemption.is_expired(current_time)
    ):
        redemption.status = RedemptionCodeStatus.EXPIRED
        await redemption.save()
    return redemption
