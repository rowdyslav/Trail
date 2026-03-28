from fastapi import APIRouter

from core.api.errors import ber, unauthorized_error
from core.api.schemas import UserProfileRead
from core.deps import CurrentUser
from core.domain.codes import list_user_active_codes
from core.models import Payment

router = APIRouter(tags=["Me"])


@router.get(
    "/me",
    responses=ber(unauthorized_error),
)
async def read_me(me: CurrentUser) -> UserProfileRead:
    active_codes = [
        code.to_read()
        for code in await list_user_active_codes(me.id)
    ]
    payments = [
        payment.to_read()
        for payment in await Payment.find(
            {
                "user_id": me.id,
                "confirmed_at": {"$ne": None},
            }
        )
        .sort("-confirmed_at")
        .to_list()
    ]
    return me.to_profile_read(
        active_codes=active_codes,
        payments=payments,
    )
