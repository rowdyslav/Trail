from fastapi import APIRouter

from core.api.errors import ber, unauthorized_error
from core.api.schemas import UserProfileRead
from core.deps import CurrentUser
from core.domain.redemptions import list_user_active_redemptions

router = APIRouter(tags=["Me"])


@router.get(
    "/me",
    responses=ber(unauthorized_error),
)
async def read_me(me: CurrentUser) -> UserProfileRead:
    active_redemptions = [
        redemption.to_read()
        for redemption in await list_user_active_redemptions(me.id)
    ]
    return me.to_profile_read(active_redemptions)
