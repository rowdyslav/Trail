from fastapi import APIRouter

from core import CurrentUser, UserRead
from core.errors import ber, unauthorized_error

router = APIRouter(tags=["Me"])


@router.get(
    "/me",
    responses=ber(unauthorized_error),
)
async def read_me(me: CurrentUser) -> UserRead:
    return me.to_read()
