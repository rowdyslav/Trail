from pymongo.errors import DuplicateKeyError

from core.api.errors import (
    active_route_not_selected_error,
    ber,
    place_not_found_error,
    place_not_in_active_route_error,
    route_already_completed_error,
    route_not_active_error,
    route_not_purchased_error,
    unauthorized_error,
)
from core.api.schemas import ScanRequest, ScanResponse
from core.deps import CurrentUser
from core.domain.rewards import RouteType
from core.domain.routes import (
    get_or_create_user_progress,
    get_user_purchase,
    mark_route_completed,
    now_utc,
)
from core.domain.streaks import calculate_streak_days
from core.models import Place, Route, RoutePlaceCompletion
from fastapi import APIRouter

router = APIRouter(tags=["Scan"])


@router.post(
    "/scan",
    responses=ber(
        unauthorized_error,
        active_route_not_selected_error,
        route_not_active_error,
        route_not_purchased_error,
        route_already_completed_error,
        place_not_found_error,
        place_not_in_active_route_error,
    ),
)
async def scan_qr(me: CurrentUser, data: ScanRequest) -> ScanResponse:
    if me.active_route_id is None:
        raise active_route_not_selected_error

    route = await Route.get(me.active_route_id, fetch_links=True)
    if route is None:
        raise route_not_active_error

    progress = await get_or_create_user_progress(me.id, route.id)
    if progress.is_completed:
        me.active_route_id = None
        await me.save()
        raise route_already_completed_error

    purchase = await get_user_purchase(me.id, route.id)
    if route.route_type == RouteType.PAID and (
        purchase is None or not purchase.is_confirmed()
    ):
        raise route_not_purchased_error

    place = await Place.find_one(Place.qr_code_value == data.qr_code_value)
    if place is None:
        raise place_not_found_error
    if not route.has_place(place.id):
        raise place_not_in_active_route_error

    place_read = place.to_read()
    existing_completion = await RoutePlaceCompletion.find_one(
        RoutePlaceCompletion.user_id == me.id,
        RoutePlaceCompletion.route_id == route.id,
        RoutePlaceCompletion.place_id == place.id,
    )
    if existing_completion is not None:
        return ScanResponse(
            success=True,
            status="already_scanned",
            already_scanned=True,
            route_id=route.id,
            route_title=route.title,
            active_route_completed=progress.is_completed,
            reward_granted=False,
            reward_points_granted=0,
            place_reward_points_granted=0,
            completion_bonus_granted=0,
            user=me.to_read(),
            place=place_read,
            completed_at=existing_completion.completed_at,
        )

    completed_at = now_utc()
    streak_days = calculate_streak_days(
        current_streak_days=me.streak_days,
        last_completed_at=me.last_completed_at,
        now=completed_at,
    )

    try:
        completion = await RoutePlaceCompletion(
            user_id=me.id,
            route_id=route.id,
            place_id=place.id,
            completed_at=completed_at,
        ).insert()
    except DuplicateKeyError:
        completion = await RoutePlaceCompletion.find_one(
            RoutePlaceCompletion.user_id == me.id,
            RoutePlaceCompletion.route_id == route.id,
            RoutePlaceCompletion.place_id == place.id,
        )
        return ScanResponse(
            success=True,
            status="already_scanned",
            already_scanned=True,
            route_id=route.id,
            route_title=route.title,
            active_route_completed=progress.is_completed,
            reward_granted=False,
            reward_points_granted=0,
            place_reward_points_granted=0,
            completion_bonus_granted=0,
            user=me.to_read(),
            place=place_read,
            completed_at=None if completion is None else completion.completed_at,
        )

    me.streak_days = streak_days
    me.sync_streak_key()
    me.last_completed_at = completed_at

    if place.id not in progress.scanned_place_ids:
        progress.scanned_place_ids.append(place.id)

    place_reward_points_granted = (
        place.reward_points if route.route_type == RouteType.PAID else 0
    )
    if place_reward_points_granted > 0:
        me.reward_points += place_reward_points_granted

    completion_bonus_granted = 0
    active_route_completed = len(progress.scanned_place_ids) == len(route.places)
    if active_route_completed:
        completion_bonus_granted = await mark_route_completed(
            user=me,
            route=route,
            progress=progress,
            completed_at=completed_at,
        )

    await progress.save()
    await me.save()

    reward_points_granted = place_reward_points_granted + completion_bonus_granted
    return ScanResponse(
        success=True,
        status="scanned",
        already_scanned=False,
        route_id=route.id,
        route_title=route.title,
        active_route_completed=active_route_completed,
        reward_granted=reward_points_granted > 0,
        reward_points_granted=reward_points_granted,
        place_reward_points_granted=place_reward_points_granted,
        completion_bonus_granted=completion_bonus_granted,
        user=me.to_read(),
        place=place_read,
        completed_at=completion.completed_at,
    )
