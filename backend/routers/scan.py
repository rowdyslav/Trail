import asyncio
from datetime import datetime

from beanie import PydanticObjectId
from fastapi import APIRouter
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
from core.api.schemas import (
    ScanAIRead,
    ScanAvatarRead,
    ScanPointRead,
    ScanRequest,
    ScanResponse,
    ScanRewardPointsRead,
    ScanRouteProgressRead,
    ScanRouteRead,
    ScanStreakRead,
)
from core.deps import CurrentUser
from core.domain.routes import (
    build_route_progress,
    get_or_create_user_progress,
    get_user_purchase,
    has_route_access,
    mark_route_completed,
    now_utc,
    sync_confirmed_route_purchase,
)
from core.domain.streaks import calculate_streak_days
from core.models import Place, Route, RoutePlaceCompletion, UserRouteProgress
from env import ENV
from utils.ai import AssistantService

router = APIRouter(tags=["Scan"])


def build_ai_fallback(place_title: str, route_title: str) -> str:
    return (
        f"{place_title} is part of route {route_title}. "
        "Nice stop, let's keep going."
    )


async def generate_scan_ai_fact(place_title: str, route_title: str) -> tuple[str, bool]:
    assistant = AssistantService()
    try:
        fact = await asyncio.wait_for(
            assistant.generate_scan_success_message(
                place_name=place_title,
                description=f"Route point: {route_title}",
            ),
            timeout=min(ENV.deepseek_timeout_seconds, 3.0),
        )
    except Exception:
        return build_ai_fallback(place_title, route_title), True
    return fact, False


def create_scan_response(
    *,
    status: str,
    message: str,
    route: Route,
    current_route_id: PydanticObjectId | None,
    place: Place,
    streak: ScanStreakRead,
    avatar: ScanAvatarRead,
    route_progress: ScanRouteProgressRead,
    reward_points: ScanRewardPointsRead,
    ai: ScanAIRead,
    completed_at: datetime | None,
) -> ScanResponse:
    return ScanResponse(
        status=status,
        message=message,
        route=ScanRouteRead(
            id=route.id,
            title=route.title,
            current_route_id=current_route_id,
        ),
        point=ScanPointRead(id=place.id, title=place.title),
        streak=streak,
        avatar=avatar,
        route_progress=route_progress,
        reward_points=reward_points,
        ai=ai,
        completed_at=completed_at,
    )


async def build_duplicate_response(
    *,
    me: CurrentUser,
    route: Route,
    place: Place,
    progress: UserRouteProgress,
    completed_at: datetime | None,
) -> ScanResponse:
    ai_fact, ai_fallback = await generate_scan_ai_fact(place.title, route.title)
    route_progress_raw = build_route_progress(route, progress)
    return create_scan_response(
        status="duplicate",
        message="Point already scanned in the selected route",
        route=route,
        current_route_id=me.active_route_id,
        place=place,
        streak=ScanStreakRead(days=me.streak_days, changed=False),
        avatar=ScanAvatarRead(state=me.streak_key, changed=False),
        route_progress=ScanRouteProgressRead(
            completed_points=route_progress_raw["completed_points"],
            total_points=route_progress_raw["total_points"],
            is_completed=route_progress_raw["is_completed"],
        ),
        reward_points=ScanRewardPointsRead(
            scan_gained=0,
            completion_bonus_gained=0,
            total_balance=me.reward_points,
        ),
        ai=ScanAIRead(fact=ai_fact, fallback=ai_fallback),
        completed_at=completed_at,
    )


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
    if purchase is not None and purchase.is_confirmed():
        sync_confirmed_route_purchase(me, route.id)
    if not has_route_access(route, me, purchase=purchase):
        await me.save()
        raise route_not_purchased_error

    place = await Place.find_one(Place.qr_code_value == data.qr_code_value)
    if place is None:
        raise place_not_found_error
    if not route.has_place(place.id):
        raise place_not_in_active_route_error

    existing_completion = await RoutePlaceCompletion.find_one(
        RoutePlaceCompletion.user_id == me.id,
        RoutePlaceCompletion.route_id == route.id,
        RoutePlaceCompletion.place_id == place.id,
    )
    if existing_completion is not None:
        return await build_duplicate_response(
            me=me,
            route=route,
            place=place,
            progress=progress,
            completed_at=existing_completion.completed_at,
        )

    completed_at = now_utc()
    previous_streak_days = me.streak_days
    previous_avatar_state = me.streak_key

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
        return await build_duplicate_response(
            me=me,
            route=route,
            place=place,
            progress=progress,
            completed_at=None if completion is None else completion.completed_at,
        )

    me.streak_days = calculate_streak_days(
        current_streak_days=me.streak_days,
        last_completed_at=me.last_completed_at,
        now=completed_at,
    )
    me.sync_streak_key()
    me.last_completed_at = completed_at

    if place.id not in progress.scanned_place_ids:
        progress.scanned_place_ids.append(place.id)

    scan_gained = place.reward_points
    if scan_gained > 0:
        me.reward_points += scan_gained

    completion_bonus_gained = 0
    if len(progress.scanned_place_ids) == len(route.places):
        completion_bonus_gained = await mark_route_completed(
            user=me,
            route=route,
            progress=progress,
            completed_at=completed_at,
        )

    await progress.save()
    await me.save()

    route_progress_raw = build_route_progress(route, progress)
    ai_fact, ai_fallback = await generate_scan_ai_fact(place.title, route.title)
    return create_scan_response(
        status="success",
        message="Point activated successfully",
        route=route,
        current_route_id=me.active_route_id,
        place=place,
        streak=ScanStreakRead(
            days=me.streak_days,
            changed=me.streak_days != previous_streak_days,
        ),
        avatar=ScanAvatarRead(
            state=me.streak_key,
            changed=me.streak_key != previous_avatar_state,
        ),
        route_progress=ScanRouteProgressRead(
            completed_points=route_progress_raw["completed_points"],
            total_points=route_progress_raw["total_points"],
            is_completed=route_progress_raw["is_completed"],
        ),
        reward_points=ScanRewardPointsRead(
            scan_gained=scan_gained,
            completion_bonus_gained=completion_bonus_gained,
            total_balance=me.reward_points,
        ),
        ai=ScanAIRead(fact=ai_fact, fallback=ai_fallback),
        completed_at=completion.completed_at,
    )
