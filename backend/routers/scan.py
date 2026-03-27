from datetime import UTC, datetime

from fastapi import APIRouter
from pymongo.errors import DuplicateKeyError

from core import (
    CurrentUser,
    Point,
    PointCompletionHistory,
    ScanRequest,
    ScanResponse,
)
from core.errors import (
    ber,
    point_not_found_error,
    unauthorized_error,
)

router = APIRouter(
    tags=["Scan"],
)


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


@router.post(
    "/scan",
    responses=ber(
        unauthorized_error,
        point_not_found_error,
    ),
)
async def scan_qr(me: CurrentUser, data: ScanRequest) -> ScanResponse:
    point = await Point.find_one(Point.qr_code_value == data.qr_code_value)
    if point is None:
        raise point_not_found_error

    point_read = point.to_read()

    completion = await PointCompletionHistory.find_one(
        PointCompletionHistory.user_id == me.id,
        PointCompletionHistory.point_id == point.id,
    )
    if completion is not None:
        return ScanResponse(
            success=True,
            already_scanned=True,
            user=me.to_read(),
            point=point_read,
            completed_at=completion.completed_at,
        )

    completed_at = datetime.now(UTC)
    streak_days = calculate_streak_days(
        current_streak_days=me.streak_days,
        last_completed_at=me.last_completed_at,
        now=completed_at,
    )

    try:
        await PointCompletionHistory(
            user_id=me.id,
            point_id=point.id,
            completed_at=completed_at,
        ).insert()
    except DuplicateKeyError:
        completion = await PointCompletionHistory.find_one(
            PointCompletionHistory.user_id == me.id,
            PointCompletionHistory.point_id == point.id,
        )
        return ScanResponse(
            success=True,
            already_scanned=True,
            user=me.to_read(),
            point=point_read,
            completed_at=None if completion is None else completion.completed_at,
        )

    me.streak_days = streak_days
    me.sync_streak_key()
    me.last_completed_at = completed_at
    await me.save()

    return ScanResponse(
        success=True,
        already_scanned=False,
        user=me.to_read(),
        point=point_read,
        completed_at=completed_at,
    )
