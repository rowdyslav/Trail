from collections import OrderedDict

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from core.api.errors import (
    code_generation_error,
    code_not_found_error,
    prize_not_found_error,
)
from core.domain.rewards import CodeStatus, generate_code
from core.domain.shared import CodePrizeItem
from core.models import Code, Prize


async def create_unique_code(
    user_id: PydanticObjectId,
    requested_points: int,
    items: list[CodePrizeItem],
) -> Code:
    for _ in range(10):
        try:
            return await Code(
                user_id=user_id,
                value=generate_code(),
                requested_points=requested_points,
                items=items,
            ).insert()
        except DuplicateKeyError:
            continue

    raise code_generation_error


async def get_code_or_404(code: str) -> Code:
    entry = await Code.find_one(Code.value == code)
    if entry is None:
        raise code_not_found_error
    return entry


async def get_user_code_or_404(user_id: PydanticObjectId, code: str) -> Code:
    entry = await Code.find_one(
        Code.value == code,
        Code.user_id == user_id,
    )
    if entry is None:
        raise code_not_found_error
    return entry


async def list_user_active_codes(user_id: PydanticObjectId) -> list[Code]:
    return (
        await Code.find(
            Code.user_id == user_id,
            Code.status == CodeStatus.ACTIVE,
        )
        .sort("-created_at")
        .to_list()
    )


async def build_code_items(
    selections: list[tuple[PydanticObjectId, int]],
) -> tuple[list[CodePrizeItem], int]:
    quantities: OrderedDict[PydanticObjectId, int] = OrderedDict()
    for prize_id, quantity in selections:
        quantities[prize_id] = quantities.get(prize_id, 0) + quantity

    prize_ids = list(quantities)
    prizes = await Prize.find({"_id": {"$in": prize_ids}, "is_active": True}).to_list()
    prizes_by_id = {prize.id: prize for prize in prizes}

    if len(prizes_by_id) != len(prize_ids):
        raise prize_not_found_error

    items: list[CodePrizeItem] = []
    requested_points = 0
    for prize_id, quantity in quantities.items():
        prize = prizes_by_id.get(prize_id)
        if prize is None:
            raise prize_not_found_error

        item = CodePrizeItem(
            prize_id=prize.id,
            title=prize.title,
            points_cost=prize.points_cost,
            quantity=quantity,
        )
        items.append(item)
        requested_points += item.total_points

    return items, requested_points
