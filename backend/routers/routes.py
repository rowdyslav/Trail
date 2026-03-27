from beanie import PydanticObjectId
from fastapi import APIRouter

from core import Route, RouteRead
from core.errors import ber, route_not_found_error

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.get("")
async def read_routes() -> list[RouteRead]:
    routes = await Route.find(fetch_links=True).to_list()
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
