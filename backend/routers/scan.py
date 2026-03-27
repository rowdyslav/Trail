from datetime import UTC, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter
from pymongo.errors import DuplicateKeyError

from core.api.errors import ber, point_not_found_error, unauthorized_error
from core.api.schemas import ScanRequest, ScanResponse
from core.deps import CurrentUser
from core.domain.rewards import RouteType
from core.domain.streaks import calculate_streak_days
from core.models import Point, PointCompletionHistory, Route, RouteCompletion

router = APIRouter(tags=["Scan"])


async def find_route_by_point(point_id: PydanticObjectId) -> Route | None:
    routes = await Route.find({}, fetch_links=True).to_list()
    return next((route for route in routes if route.has_point(point_id)), None)


@router.post(
    "/scan",
    responses=ber(unauthorized_error, point_not_found_error),
)
async def scan_qr(me: CurrentUser, data: ScanRequest) -> ScanResponse:
    point = await Point.find_one(Point.qr_code_value == data.qr_code_value)
    if point is None:
        raise point_not_found_error

    route = await find_route_by_point(point.id)
    if route is None:
        raise point_not_found_error

    point_read = point.to_read()

    completion = await PointCompletionHistory.find_one(
        PointCompletionHistory.user_id == me.id,
        PointCompletionHistory.point_id == point.id,
    )
    if completion is not None:
        route_completed = (
            await RouteCompletion.find_one(
                RouteCompletion.user_id == me.id,
                RouteCompletion.route_id == route.id,
            )
            is not None
        )
        return ScanResponse(
            success=True,
            already_scanned=True,
            route_id=route.id,
            route_completed=route_completed,
            reward_granted=False,
            reward_points_granted=0,
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
        route_completed = (
            await RouteCompletion.find_one(
                RouteCompletion.user_id == me.id,
                RouteCompletion.route_id == route.id,
            )
            is not None
        )
        return ScanResponse(
            success=True,
            already_scanned=True,
            route_id=route.id,
            route_completed=route_completed,
            reward_granted=False,
            reward_points_granted=0,
            user=me.to_read(),
            point=point_read,
            completed_at=None if completion is None else completion.completed_at,
        )

    me.streak_days = streak_days
    me.sync_streak_key()
    me.last_completed_at = completed_at

    route_point_ids = [route_point.id for route_point in route.points]
    scanned_point_ids = {
        completion.point_id
        for completion in await PointCompletionHistory.find(
            {
                "user_id": me.id,
                "point_id": {"$in": route_point_ids},
            }
        ).to_list()
    }
    route_completed = len(scanned_point_ids) == len(route.points)
    reward_granted = False
    reward_points_granted = 0

    if route_completed:
        try:
            await RouteCompletion(
                user_id=me.id,
                route_id=route.id,
                completed_at=completed_at,
                reward_points_granted=(
                    route.reward_points_on_completion
                    if route.route_type == RouteType.PAID
                    else 0
                ),
            ).insert()
        except DuplicateKeyError:
            pass
        else:
            if route.route_type == RouteType.PAID:
                reward_points_granted = route.reward_points_on_completion
                me.reward_points += reward_points_granted
                reward_granted = reward_points_granted > 0

    await me.save()

    return ScanResponse(
        success=True,
        already_scanned=False,
        route_id=route.id,
        route_completed=route_completed,
        reward_granted=reward_granted,
        reward_points_granted=reward_points_granted,
        user=me.to_read(),
        point=point_read,
        completed_at=completed_at,
    )
