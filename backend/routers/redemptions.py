from datetime import UTC, datetime

from fastapi import APIRouter

from core.api.errors import (
    ber,
    insufficient_reward_points_error,
    redemption_code_generation_error,
    redemption_code_not_active_error,
    redemption_code_not_found_error,
    unauthorized_error,
)
from core.api.schemas import RedemptionCodeRead, RedemptionRequest
from core.deps import CurrentUser
from core.domain.redemptions import (
    create_unique_redemption_code,
    get_user_redemption_or_404,
    sync_redemption_status,
)
from core.domain.rewards import RedemptionCodeStatus

router = APIRouter(prefix="/redemptions", tags=["Redemptions"])


@router.post(
    "/request",
    responses=ber(
        unauthorized_error,
        insufficient_reward_points_error,
        redemption_code_generation_error,
    ),
)
async def request_redemption_code(
    me: CurrentUser, data: RedemptionRequest
) -> RedemptionCodeRead:
    if me.reward_points < data.requested_points:
        raise insufficient_reward_points_error

    redemption = await create_unique_redemption_code(
        user_id=me.id,
        requested_points=data.requested_points,
        context=data.context,
    )
    return redemption.to_read()


@router.get(
    "/{code}",
    responses=ber(unauthorized_error, redemption_code_not_found_error),
)
async def read_redemption_code(me: CurrentUser, code: str) -> RedemptionCodeRead:
    redemption = await get_user_redemption_or_404(me.id, code)
    await sync_redemption_status(redemption, datetime.now(UTC))
    return redemption.to_read()


@router.post(
    "/{code}/cancel",
    responses=ber(
        unauthorized_error,
        redemption_code_not_found_error,
        redemption_code_not_active_error,
    ),
)
async def cancel_redemption_code(me: CurrentUser, code: str) -> RedemptionCodeRead:
    redemption = await get_user_redemption_or_404(me.id, code)

    now = datetime.now(UTC)
    await sync_redemption_status(redemption, now)
    if redemption.status == RedemptionCodeStatus.EXPIRED:
        raise redemption_code_not_active_error
    if redemption.status != RedemptionCodeStatus.ACTIVE:
        raise redemption_code_not_active_error

    redemption.status = RedemptionCodeStatus.CANCELLED
    redemption.cancelled_at = now
    await redemption.save()
    return redemption.to_read()
