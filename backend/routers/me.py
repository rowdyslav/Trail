from fastapi import APIRouter

from core.api.errors import ber, unauthorized_error
from core.api.schemas import UserProfileRead
from core.deps import CurrentUser
from core.domain.redemptions import list_user_active_redemptions
from core.models import RoutePurchase

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
    purchased_routes = [
        purchase.to_read()
        for purchase in await RoutePurchase.find(
            {
                "user_id": me.id,
                "confirmed_at": {"$ne": None},
            }
        )
        .sort("-confirmed_at")
        .to_list()
    ]
    return me.to_profile_read(
        active_redemptions=active_redemptions,
        purchased_routes=purchased_routes,
    )
