from __future__ import annotations

from datetime import UTC, datetime

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from core.api.errors import route_not_found_error
from core.domain.rewards import RouteType
from core.models import Route, RouteCompletion, RoutePurchase, User, UserRouteProgress


async def get_route_or_404(route_id: PydanticObjectId) -> Route:
    route = await Route.get(route_id, fetch_links=True)
    if route is None:
        raise route_not_found_error
    return route


async def get_user_purchase(
    user_id: PydanticObjectId,
    route_id: PydanticObjectId,
) -> RoutePurchase | None:
    return await RoutePurchase.find_one(
        RoutePurchase.user_id == user_id,
        RoutePurchase.route_id == route_id,
    )


async def get_user_progress(
    user_id: PydanticObjectId,
    route_id: PydanticObjectId,
) -> UserRouteProgress | None:
    return await UserRouteProgress.find_one(
        UserRouteProgress.user_id == user_id,
        UserRouteProgress.route_id == route_id,
    )


async def get_or_create_user_progress(
    user_id: PydanticObjectId,
    route_id: PydanticObjectId,
) -> UserRouteProgress:
    progress = await get_user_progress(user_id, route_id)
    if progress is not None:
        return progress

    try:
        return await UserRouteProgress(user_id=user_id, route_id=route_id).insert()
    except DuplicateKeyError:
        progress = await get_user_progress(user_id, route_id)
        if progress is None:
            raise
        return progress


async def is_route_purchased(user_id: PydanticObjectId, route_id: PydanticObjectId) -> bool:
    purchase = await get_user_purchase(user_id, route_id)
    return purchase is not None and purchase.is_confirmed()


async def build_route_read_for_user(route: Route, user: User):
    progress = await get_user_progress(user.id, route.id)
    purchase = await get_user_purchase(user.id, route.id)
    scanned_places_count = 0 if progress is None else len(progress.scanned_place_ids)

    return route.to_read(
        is_purchased=route.route_type == RouteType.FREE
        or (purchase is not None and purchase.is_confirmed()),
        is_active=user.active_route_id == route.id,
        is_completed=False if progress is None else progress.is_completed,
        scanned_places_count=scanned_places_count,
    )


async def mark_route_completed(
    *,
    user: User,
    route: Route,
    progress: UserRouteProgress,
    completed_at: datetime,
) -> int:
    if progress.is_completed:
        return 0

    bonus = route.reward_points_on_completion if route.route_type == RouteType.PAID else 0
    try:
        await RouteCompletion(
            user_id=user.id,
            route_id=route.id,
            completed_at=completed_at,
            reward_points_granted=bonus,
        ).insert()
    except DuplicateKeyError:
        progress.is_completed = True
        progress.completed_at = progress.completed_at or completed_at
        if progress.completion_bonus_granted == 0 and bonus > 0:
            progress.completion_bonus_granted = bonus
        user.active_route_id = None
        return 0

    progress.is_completed = True
    progress.completed_at = completed_at
    progress.completion_bonus_granted = bonus
    user.active_route_id = None
    if bonus > 0:
        user.reward_points += bonus
    return bonus


def now_utc() -> datetime:
    return datetime.now(UTC)
