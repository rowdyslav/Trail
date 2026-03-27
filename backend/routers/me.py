from fastapi import APIRouter

from core.api.errors import ber, unauthorized_error
from core.api.schemas import UserRead
from core.deps import CurrentUser

router = APIRouter(tags=["Me"])


@router.get(
    "/me",
    responses=ber(unauthorized_error),
)
async def read_me(me: CurrentUser) -> UserRead:
    return me.to_read()
