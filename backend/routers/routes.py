from typing import Annotated

from beanie import PydanticObjectId
from fastapi import APIRouter, Query

from core.api.errors import ber, route_not_found_error
from core.api.schemas import RouteRead
from core.domain.rewards import RouteType
from core.models import Route

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.get("")
async def read_routes(
    route_type: Annotated[RouteType | None, Query()] = None,
) -> list[RouteRead]:
    filters = {} if route_type is None else {"route_type": route_type}
    routes = await Route.find(filters, fetch_links=True).to_list()
    return [route.to_read() for route in routes]


@router.get(
    "/{route_id}",
    responses=ber(route_not_found_error),
)
async def read_route(route_id: PydanticObjectId) -> RouteRead:
    route = await Route.get(route_id, fetch_links=True)
    if route is None:
        raise route_not_found_error
    return route.to_read()
