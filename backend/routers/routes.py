from datetime import UTC, datetime
from typing import Annotated

from beanie import PydanticObjectId
from fastapi import APIRouter, Query

from core.api.errors import (
    active_route_not_selected_error,
    ber,
    payment_failed_error,
    payment_not_confirmed_error,
    route_already_completed_error,
    route_not_active_error,
    route_not_available_for_purchase_error,
    route_not_found_error,
    route_not_purchased_error,
    unauthorized_error,
)
from core.api.schemas import (
    RoutePurchaseRead,
    RoutePurchaseRequest,
    RouteRead,
    RouteSelectionRead,
    RouteViewerStateRead,
)
from core.deps import CurrentUser, CurrentUserOptional
from core.domain.rewards import RouteType
from core.domain.routes import (
    build_route_read,
    build_route_viewer_state_for_user,
    build_route_viewer_states_for_user,
    get_route_or_404,
    get_user_progress,
    get_user_purchase,
    has_route_access,
    sync_confirmed_route_purchase,
)
from core.models import Route, RoutePurchase, UserRouteProgress
from utils.payment_processor import PaymentProcessor

router = APIRouter(prefix="/routes", tags=["Routes"])


def get_payment_processor() -> PaymentProcessor:
    return PaymentProcessor()


@router.get(
    "",
)
async def read_routes(
    me: CurrentUserOptional = None,
    route_type: Annotated[RouteType | None, Query()] = None,
) -> list[RouteRead]:
    filters = {} if route_type is None else {"route_type": route_type}
    routes = await Route.find(filters, fetch_links=True).to_list()
    if me is None:
        return [build_route_read(route) for route in routes]

    route_ids = [route.id for route in routes]
    progresses = await UserRouteProgress.find(
        {"user_id": me.id, "route_id": {"$in": route_ids}}
    ).to_list()
    purchases = await RoutePurchase.find(
        {"user_id": me.id, "route_id": {"$in": route_ids}}
    ).to_list()

    progress_by_route_id = {progress.route_id: progress for progress in progresses}
    purchase_by_route_id = {purchase.route_id: purchase for purchase in purchases}

    user_changed = False
    for purchase in purchases:
        if purchase.is_confirmed():
            synced = sync_confirmed_route_purchase(me, purchase.route_id)
            user_changed = synced or user_changed
    if user_changed:
        await me.save()

    return [
        build_route_read(
            route,
            me,
            progress=progress_by_route_id.get(route.id),
            purchase=purchase_by_route_id.get(route.id),
        )
        for route in routes
    ]


@router.get(
    "/viewer-states",
    responses=ber(unauthorized_error),
)
async def read_route_viewer_states(me: CurrentUser) -> list[RouteViewerStateRead]:
    routes = await Route.find({}, fetch_links=True).to_list()
    states = await build_route_viewer_states_for_user(routes, me)
    await me.save()
    return states


@router.get(
    "/{route_id}/viewer-state",
    responses=ber(unauthorized_error, route_not_found_error),
)
async def read_route_viewer_state(
    me: CurrentUser,
    route_id: PydanticObjectId,
) -> RouteViewerStateRead:
    route = await get_route_or_404(route_id)
    state = await build_route_viewer_state_for_user(route, me)
    await me.save()
    return state


@router.get(
    "/{route_id}",
    responses=ber(route_not_found_error),
)
async def read_route(route_id: PydanticObjectId) -> RouteRead:
    route = await get_route_or_404(route_id)
    return build_route_read(route)


@router.post(
    "/{route_id}/select",
    responses=ber(
        unauthorized_error,
        route_not_found_error,
        route_not_purchased_error,
        route_already_completed_error,
    ),
)
async def select_route(
    me: CurrentUser,
    route_id: PydanticObjectId,
) -> RouteSelectionRead:
    route = await get_route_or_404(route_id)
    progress = await get_user_progress(me.id, route.id)
    if progress is not None and progress.is_completed:
        raise route_already_completed_error

    purchase = await get_user_purchase(me.id, route.id)
    if purchase is not None and purchase.is_confirmed():
        sync_confirmed_route_purchase(me, route.id)
    if not has_route_access(route, me, purchase=purchase):
        raise route_not_purchased_error

    me.active_route_id = route.id
    await me.save()
    return RouteSelectionRead(route_id=route.id, is_active=True)


@router.post(
    "/{route_id}/purchase",
    responses=ber(
        unauthorized_error,
        route_not_found_error,
        route_not_available_for_purchase_error,
        route_already_completed_error,
    ),
)
async def purchase_route(
    me: CurrentUser,
    route_id: PydanticObjectId,
    data: RoutePurchaseRequest,
) -> RoutePurchaseRead:
    route = await get_route_or_404(route_id)
    if route.route_type != RouteType.PAID:
        raise route_not_available_for_purchase_error

    progress = await get_user_progress(me.id, route.id)
    if progress is not None and progress.is_completed:
        raise route_already_completed_error

    purchase = await get_user_purchase(me.id, route.id)
    if purchase is not None and purchase.is_confirmed():
        sync_confirmed_route_purchase(me, route.id)
        await me.save()
        return purchase.to_read()

    processor = get_payment_processor()
    payment = processor.process_yookassa_payment(
        amount=route.price_rub,
        return_url=str(data.return_url),
        description=f"Покупка маршрута {route.title}",
        order_id=f"route:{route.id}:user:{me.id}",
    )

    if purchase is None:
        purchase = await RoutePurchase(
            user_id=me.id,
            route_id=route.id,
            payment_id=payment["payment_id"],
            payment_status=payment["status"],
            amount_rub=route.price_rub,
            purchased_at=datetime.now(UTC),
            confirmed_at=(
                datetime.now(UTC) if payment["status"] == "succeeded" else None
            ),
        ).insert()
    else:
        purchase.payment_id = payment["payment_id"]
        purchase.payment_status = payment["status"]
        purchase.amount_rub = route.price_rub
        purchase.purchased_at = datetime.now(UTC)
        purchase.confirmed_at = None
        if payment["status"] == "succeeded":
            purchase.confirmed_at = datetime.now(UTC)
        await purchase.save()

    if purchase.is_confirmed():
        sync_confirmed_route_purchase(me, route.id)
        await me.save()

    return purchase.to_read(confirmation_url=payment["confirmation_url"])


@router.post(
    "/{route_id}/purchase/confirm",
    responses=ber(
        unauthorized_error,
        route_not_found_error,
        route_not_purchased_error,
        payment_not_confirmed_error,
        payment_failed_error,
    ),
)
async def confirm_route_purchase(
    me: CurrentUser,
    route_id: PydanticObjectId,
) -> RoutePurchaseRead:
    _ = await get_route_or_404(route_id)
    purchase = await get_user_purchase(me.id, route_id)
    if purchase is None or purchase.payment_id is None:
        raise route_not_purchased_error

    processor = get_payment_processor()
    payment_status = processor.get_yookassa_payment_status(purchase.payment_id)
    purchase.payment_status = payment_status

    if payment_status == "succeeded":
        purchase.confirmed_at = purchase.confirmed_at or datetime.now(UTC)
        sync_confirmed_route_purchase(me, route_id)
        await purchase.save()
        await me.save()
        return purchase.to_read()

    await purchase.save()
    if payment_status in {"canceled", "cancelled"}:
        raise payment_failed_error
    raise payment_not_confirmed_error


@router.delete(
    "/active",
    responses=ber(
        unauthorized_error,
        active_route_not_selected_error,
        route_not_active_error,
    ),
)
async def clear_active_route(me: CurrentUser) -> RouteSelectionRead:
    if me.active_route_id is None:
        raise active_route_not_selected_error

    route_id = me.active_route_id
    route = await Route.get(route_id, fetch_links=True)
    if route is None:
        me.active_route_id = None
        await me.save()
        raise route_not_active_error

    me.active_route_id = None
    await me.save()
    return RouteSelectionRead(route_id=route_id, is_active=False)
