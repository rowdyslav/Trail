from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from pymongo.errors import DuplicateKeyError

from core.api.errors import route_not_found_error
from core.domain.rewards import RouteType
from core.models import Payment, Route, User, Walk

if TYPE_CHECKING:
    from beanie import PydanticObjectId

    from core.api.schemas import RouteRead


async def get_route_or_404(route_id: PydanticObjectId) -> Route:
    route = await Route.get(route_id, fetch_links=True)
    if route is None:
        raise route_not_found_error
    return route


async def get_user_payment(
    user_id: PydanticObjectId,
    route_id: PydanticObjectId,
) -> Payment | None:
    return await Payment.find_one(
        Payment.user_id == user_id,
        Payment.route_id == route_id,
    )


async def get_walk(
    user_id: PydanticObjectId,
    route_id: PydanticObjectId,
) -> Walk | None:
    return await Walk.find_one(
        Walk.user_id == user_id,
        Walk.route_id == route_id,
    )


async def get_or_create_walk(
    user_id: PydanticObjectId,
    route_id: PydanticObjectId,
) -> Walk:
    walk = await get_walk(user_id, route_id)
    if walk is not None:
        return walk

    try:
        return await Walk(user_id=user_id, route_id=route_id).insert()
    except DuplicateKeyError:
        walk = await get_walk(user_id, route_id)
        if walk is None:
            raise
        return walk


def grant_route_access_from_payment(user: User, route_id: PydanticObjectId) -> bool:
    if route_id in user.purchased_route_ids:
        return False
    user.purchased_route_ids.append(route_id)
    return True


def has_route_access(
    route: Route,
    user: User,
    *,
    payment: Payment | None = None,
) -> bool:
    if route.route_type == RouteType.FREE:
        return True
    return route.id in user.purchased_route_ids or (
        payment is not None and payment.is_confirmed()
    )


def build_walk_progress(route: Route, walk: Walk | None) -> dict[str, int | bool]:
    completed_points = 0 if walk is None else len(walk.scanned_place_ids)
    return {
        "completed_points": completed_points,
        "total_points": len(route.places),
        "is_completed": False if walk is None else walk.is_completed,
    }


def build_route_read(
    route: Route,
    user: User | None = None,
    *,
    walk: Walk | None = None,
    payment: Payment | None = None,
) -> RouteRead:
    route_read = route.to_read()
    if user is None:
        return route_read

    route_read.is_purchased = has_route_access(route, user, payment=payment)
    route_read.is_available = route_read.is_purchased
    route_read.is_active = user.active_route_id == route.id
    route_read.is_completed = False if walk is None else walk.is_completed
    route_read.scanned_places_count = 0 if walk is None else len(walk.scanned_place_ids)
    return route_read


async def mark_walk_completed(
    *,
    user: User,
    route: Route,
    walk: Walk,
    completed_at: datetime,
) -> int:
    if walk.is_completed:
        return 0

    bonus = route.reward_points_on_completion if route.route_type == RouteType.PAID else 0
    walk.is_completed = True
    walk.completed_at = completed_at
    user.active_route_id = None
    if bonus > 0:
        user.reward_points += bonus
    return bonus


def now_utc() -> datetime:
    return datetime.now(UTC)
