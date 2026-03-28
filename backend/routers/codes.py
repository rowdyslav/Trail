from datetime import UTC, datetime

from fastapi import APIRouter

from core.api.errors import (
    ber,
    code_generation_error,
    code_not_active_error,
    code_not_found_error,
    insufficient_reward_points_error,
    prize_not_found_error,
    unauthorized_error,
)
from core.api.schemas import CodeRead, CodeRequest
from core.deps import CurrentUser
from core.domain.codes import (
    build_code_items,
    create_unique_code,
    get_user_code_or_404,
)
from core.domain.rewards import CodeStatus

router = APIRouter(prefix="/codes", tags=["Codes"])


@router.post(
    "",
    responses=ber(
        unauthorized_error,
        insufficient_reward_points_error,
        prize_not_found_error,
        code_generation_error,
    ),
)
async def create_code(me: CurrentUser, data: CodeRequest) -> CodeRead:
    items, requested_points = await build_code_items(
        [(item.prize_id, item.quantity) for item in data.items]
    )
    if me.reward_points < requested_points:
        raise insufficient_reward_points_error

    previous_points = me.reward_points
    me.reward_points -= requested_points
    await me.save()

    try:
        entry = await create_unique_code(
            user_id=me.id,
            requested_points=requested_points,
            items=items,
        )
    except Exception:
        me.reward_points = previous_points
        await me.save()
        raise

    return entry.to_read()


@router.get(
    "/{code}",
    responses=ber(unauthorized_error, code_not_found_error),
)
async def read_code(me: CurrentUser, code: str) -> CodeRead:
    entry = await get_user_code_or_404(me.id, code)
    return entry.to_read()


@router.delete(
    "/{code}",
    responses=ber(
        unauthorized_error,
        code_not_found_error,
        code_not_active_error,
    ),
)
async def cancel_code(me: CurrentUser, code: str) -> CodeRead:
    entry = await get_user_code_or_404(me.id, code)
    if entry.status != CodeStatus.ACTIVE:
        raise code_not_active_error

    me.reward_points += entry.requested_points
    entry.status = CodeStatus.CANCELLED
    entry.cancelled_at = datetime.now(UTC)

    await me.save()
    await entry.save()
    return entry.to_read()
