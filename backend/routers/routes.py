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
from core.api.schemas import PaymentRead, RoutePaymentRequest, RouteRead, RouteSelectionRead
from core.deps import CurrentUser, CurrentUserOptional
from core.domain.rewards import RouteType
from core.domain.routes import (
    build_route_read,
    get_route_or_404,
    get_user_payment,
    get_walk,
    grant_route_access_from_payment,
    has_route_access,
)
from core.models import Payment, Route, Walk
from utils.payment_processor import PaymentProcessor

router = APIRouter(prefix="/routes", tags=["Routes"])


def get_payment_processor() -> PaymentProcessor:
    return PaymentProcessor()


@router.get("")
async def read_routes(
    me: CurrentUserOptional = None,
    route_type: Annotated[RouteType | None, Query()] = None,
) -> list[RouteRead]:
    filters = {} if route_type is None else {"route_type": route_type}
    routes = await Route.find(filters, fetch_links=True).to_list()
    if me is None:
        return [build_route_read(route) for route in routes]

    route_ids = [route.id for route in routes]
    walks = await Walk.find({"user_id": me.id, "route_id": {"$in": route_ids}}).to_list()
    payments = await Payment.find(
        {"user_id": me.id, "route_id": {"$in": route_ids}}
    ).to_list()

    walk_by_route_id = {walk.route_id: walk for walk in walks}
    payment_by_route_id = {payment.route_id: payment for payment in payments}

    user_changed = False
    for payment in payments:
        if payment.is_confirmed():
            user_changed = grant_route_access_from_payment(me, payment.route_id) or user_changed
    if user_changed:
        await me.save()

    return [
        build_route_read(
            route,
            me,
            walk=walk_by_route_id.get(route.id),
            payment=payment_by_route_id.get(route.id),
        )
        for route in routes
    ]


@router.get(
    "/{route_id}",
    responses=ber(route_not_found_error),
)
async def read_route(
    route_id: PydanticObjectId,
    me: CurrentUserOptional = None,
) -> RouteRead:
    route = await get_route_or_404(route_id)
    if me is None:
        return build_route_read(route)

    walk = await get_walk(me.id, route.id)
    payment = await get_user_payment(me.id, route.id)
    if payment is not None and payment.is_confirmed():
        changed = grant_route_access_from_payment(me, route.id)
        if changed:
            await me.save()
    return build_route_read(route, me, walk=walk, payment=payment)


@router.post(
    "/{route_id}/select",
    responses=ber(
        unauthorized_error,
        route_not_found_error,
        route_not_purchased_error,
        route_already_completed_error,
    ),
)
async def select_route(me: CurrentUser, route_id: PydanticObjectId) -> RouteSelectionRead:
    route = await get_route_or_404(route_id)
    walk = await get_walk(me.id, route.id)
    if walk is not None and walk.is_completed:
        raise route_already_completed_error

    payment = await get_user_payment(me.id, route.id)
    if payment is not None and payment.is_confirmed():
        grant_route_access_from_payment(me, route.id)
    if not has_route_access(route, me, payment=payment):
        raise route_not_purchased_error

    me.active_route_id = route.id
    await me.save()
    return RouteSelectionRead(route_id=route.id, is_active=True)


@router.post(
    "/{route_id}/payments",
    responses=ber(
        unauthorized_error,
        route_not_found_error,
        route_not_available_for_purchase_error,
        route_already_completed_error,
    ),
)
async def create_route_payment(
    me: CurrentUser,
    route_id: PydanticObjectId,
    data: RoutePaymentRequest,
) -> PaymentRead:
    route = await get_route_or_404(route_id)
    if route.route_type != RouteType.PAID:
        raise route_not_available_for_purchase_error

    walk = await get_walk(me.id, route.id)
    if walk is not None and walk.is_completed:
        raise route_already_completed_error

    payment = await get_user_payment(me.id, route.id)
    if payment is not None and payment.is_confirmed():
        grant_route_access_from_payment(me, route.id)
        await me.save()
        return payment.to_read()

    processor = get_payment_processor()
    payment_result = processor.process_yookassa_payment(
        amount=route.price_rub,
        return_url=str(data.return_url),
        description=f"Покупка маршрута {route.title}",
        order_id=f"route:{route.id}:user:{me.id}",
    )

    if payment is None:
        payment = await Payment(
            user_id=me.id,
            route_id=route.id,
            payment_id=payment_result["payment_id"],
            payment_status=payment_result["status"],
            amount_rub=route.price_rub,
            purchased_at=datetime.now(UTC),
            confirmed_at=(
                datetime.now(UTC) if payment_result["status"] == "succeeded" else None
            ),
        ).insert()
    else:
        payment.payment_id = payment_result["payment_id"]
        payment.payment_status = payment_result["status"]
        payment.amount_rub = route.price_rub
        payment.purchased_at = datetime.now(UTC)
        payment.confirmed_at = (
            datetime.now(UTC) if payment_result["status"] == "succeeded" else None
        )
        await payment.save()

    if payment.is_confirmed():
        grant_route_access_from_payment(me, route.id)
        await me.save()

    return payment.to_read(confirmation_url=payment_result["confirmation_url"])


@router.post(
    "/{route_id}/payments/confirm",
    responses=ber(
        unauthorized_error,
        route_not_found_error,
        route_not_purchased_error,
        payment_not_confirmed_error,
        payment_failed_error,
    ),
)
async def confirm_route_payment(
    me: CurrentUser,
    route_id: PydanticObjectId,
) -> PaymentRead:
    _ = await get_route_or_404(route_id)
    payment = await get_user_payment(me.id, route_id)
    if payment is None or payment.payment_id is None:
        raise route_not_purchased_error

    processor = get_payment_processor()
    payment_status = processor.get_yookassa_payment_status(payment.payment_id)
    payment.payment_status = payment_status

    if payment_status == "succeeded":
        payment.confirmed_at = payment.confirmed_at or datetime.now(UTC)
        grant_route_access_from_payment(me, route_id)
        await payment.save()
        await me.save()
        return payment.to_read()

    await payment.save()
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
