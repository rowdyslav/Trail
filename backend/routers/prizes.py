from fastapi import APIRouter

from core.api.errors import ber, unauthorized_error
from core.api.schemas import PrizeRead
from core.deps import CurrentUser
from core.models import Prize

router = APIRouter(prefix="/prizes", tags=["Prizes"])


@router.get(
    "",
    responses=ber(unauthorized_error),
)
async def list_prizes(_: CurrentUser) -> list[PrizeRead]:
    prizes = await Prize.find({"is_active": True}).sort("title").to_list()
    return [prize.to_read() for prize in prizes]
