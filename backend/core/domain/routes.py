from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from pymongo.errors import DuplicateKeyError

from core.api.errors import route_not_found_error
from core.domain.rewards import RouteType
from core.models import Route, RouteCompletion, RoutePurchase, User, UserRouteProgress

if TYPE_CHECKING:
    from beanie import PydanticObjectId

    from core.api.schemas import RouteRead, RouteViewerStateRead


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


async def is_route_purchased(
    user_id: PydanticObjectId,
    route_id: PydanticObjectId,
) -> bool:
    purchase = await get_user_purchase(user_id, route_id)
    return purchase is not None and purchase.is_confirmed()


def sync_confirmed_route_purchase(user: User, route_id: PydanticObjectId) -> bool:
    if route_id in user.purchased_route_ids:
        return False

    user.purchased_route_ids.append(route_id)
    return True


def has_route_access(
    route: Route,
    user: User,
    *,
    purchase: RoutePurchase | None = None,
) -> bool:
    if route.route_type == RouteType.FREE:
        return True

    return route.id in user.purchased_route_ids or (
        purchase is not None and purchase.is_confirmed()
    )


def build_route_progress(
    route: Route,
    progress: UserRouteProgress | None,
) -> dict[str, int | bool]:
    completed_points = 0 if progress is None else len(progress.scanned_place_ids)
    return {
        "completed_points": completed_points,
        "total_points": len(route.places),
        "is_completed": False if progress is None else progress.is_completed,
    }


def build_route_read(
    route: Route,
    user: User | None = None,
    *,
    progress: UserRouteProgress | None = None,
    purchase: RoutePurchase | None = None,
) -> RouteRead:
    route_read = route.to_read()
    if user is None:
        route_read.is_purchased = route.route_type == RouteType.FREE
        route_read.is_available = route_read.is_purchased
        return route_read

    route_read.is_purchased = has_route_access(route, user, purchase=purchase)
    route_read.is_available = route_read.is_purchased
    route_read.is_active = user.active_route_id == route.id
    route_read.is_completed = False if progress is None else progress.is_completed
    route_read.scanned_places_count = (
        0 if progress is None else len(progress.scanned_place_ids)
    )
    return route_read


def build_route_viewer_state(
    route: Route,
    user: User,
    *,
    progress: UserRouteProgress | None = None,
    purchase: RoutePurchase | None = None,
) -> RouteViewerStateRead:
    scanned_places_count = 0 if progress is None else len(progress.scanned_place_ids)
    is_purchased = has_route_access(route, user, purchase=purchase)

    return route.to_viewer_state_read(
        is_purchased=is_purchased,
        is_active=user.active_route_id == route.id,
        is_completed=False if progress is None else progress.is_completed,
        scanned_places_count=scanned_places_count,
    )


async def build_route_viewer_state_for_user(
    route: Route,
    user: User,
) -> RouteViewerStateRead:
    progress = await get_user_progress(user.id, route.id)
    purchase = await get_user_purchase(user.id, route.id)
    if purchase is not None and purchase.is_confirmed():
        sync_confirmed_route_purchase(user, route.id)
    return build_route_viewer_state(route, user, progress=progress, purchase=purchase)


async def build_route_viewer_states_for_user(
    routes: list[Route],
    user: User,
) -> list[RouteViewerStateRead]:
    if not routes:
        return []

    route_ids = [route.id for route in routes]
    progresses = await UserRouteProgress.find(
        {
            "user_id": user.id,
            "route_id": {"$in": route_ids},
        }
    ).to_list()
    purchases = await RoutePurchase.find(
        {
            "user_id": user.id,
            "route_id": {"$in": route_ids},
        }
    ).to_list()

    progress_by_route_id = {progress.route_id: progress for progress in progresses}
    purchase_by_route_id = {purchase.route_id: purchase for purchase in purchases}
    for purchase in purchases:
        if purchase.is_confirmed():
            sync_confirmed_route_purchase(user, purchase.route_id)

    return [
        build_route_viewer_state(
            route,
            user,
            progress=progress_by_route_id.get(route.id),
            purchase=purchase_by_route_id.get(route.id),
        )
        for route in routes
    ]


async def mark_route_completed(
    *,
    user: User,
    route: Route,
    progress: UserRouteProgress,
    completed_at: datetime,
) -> int:
    if progress.is_completed:
        return 0

    bonus = (
        route.reward_points_on_completion
        if route.route_type == RouteType.PAID
        else 0
    )
    try:
        await RouteCompletion(
            user_id=user.id,
            route_id=route.id,
            completed_at=completed_at,
        ).insert()
    except DuplicateKeyError:
        progress.is_completed = True
        progress.completed_at = progress.completed_at or completed_at
        user.active_route_id = None
        return 0

    progress.is_completed = True
    progress.completed_at = completed_at
    user.active_route_id = None
    if bonus > 0:
        user.reward_points += bonus
    return bonus


def now_utc() -> datetime:
    return datetime.now(UTC)
