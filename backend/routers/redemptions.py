from datetime import UTC, datetime

from fastapi import APIRouter

from core.api.errors import (
    ber,
    insufficient_reward_points_error,
    prize_not_found_error,
    redemption_code_generation_error,
    redemption_code_not_active_error,
    redemption_code_not_found_error,
    unauthorized_error,
)
from core.api.schemas import RedemptionCodeRead, RedemptionRequest
from core.deps import CurrentUser
from core.domain.redemptions import (
    build_redemption_items,
    create_unique_redemption_code,
    get_user_redemption_or_404,
    sync_redemption_status,
)
from core.domain.rewards import RedemptionCodeStatus

router = APIRouter(prefix="/redemptions", tags=["Redemptions"])


@router.post(
    "",
    responses=ber(
        unauthorized_error,
        insufficient_reward_points_error,
        prize_not_found_error,
        redemption_code_generation_error,
    ),
)
async def create_redemption_code(
    me: CurrentUser, data: RedemptionRequest
) -> RedemptionCodeRead:
    items, requested_points = await build_redemption_items(
        [(item.prize_id, item.quantity) for item in data.items]
    )
    if me.reward_points < requested_points:
        raise insufficient_reward_points_error

    previous_points = me.reward_points
    me.reward_points -= requested_points
    await me.save()

    try:
        redemption = await create_unique_redemption_code(
            user_id=me.id,
            requested_points=requested_points,
            context=data.context,
            items=items,
        )
    except Exception:
        me.reward_points = previous_points
        await me.save()
        raise

    return redemption.to_read()


@router.get(
    "/{code}",
    responses=ber(unauthorized_error, redemption_code_not_found_error),
)
async def read_redemption_code(me: CurrentUser, code: str) -> RedemptionCodeRead:
    redemption = await get_user_redemption_or_404(me.id, code)
    await sync_redemption_status(redemption)
    return redemption.to_read()


@router.delete(
    "/{code}",
    responses=ber(
        unauthorized_error,
        redemption_code_not_found_error,
        redemption_code_not_active_error,
    ),
)
async def cancel_redemption_code(me: CurrentUser, code: str) -> RedemptionCodeRead:
    redemption = await get_user_redemption_or_404(me.id, code)
    await sync_redemption_status(redemption)
    if redemption.status != RedemptionCodeStatus.ACTIVE:
        raise redemption_code_not_active_error

    me.reward_points += redemption.requested_points
    redemption.status = RedemptionCodeStatus.CANCELLED
    redemption.cancelled_at = datetime.now(UTC)

    await me.save()
    await redemption.save()
    return redemption.to_read()
