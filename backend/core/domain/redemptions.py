from collections import OrderedDict

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from core.api.errors import (
    prize_not_found_error,
    redemption_code_generation_error,
    redemption_code_not_found_error,
)
from core.domain.rewards import RedemptionCodeStatus, generate_redemption_code
from core.domain.shared import RedemptionPrizeItem
from core.models import Prize, RedemptionCode


async def create_unique_redemption_code(
    user_id: PydanticObjectId,
    requested_points: int,
    items: list[RedemptionPrizeItem],
) -> RedemptionCode:
    for _ in range(10):
        try:
            return await RedemptionCode(
                user_id=user_id,
                code=generate_redemption_code(),
                requested_points=requested_points,
                items=items,
            ).insert()
        except DuplicateKeyError:
            continue

    raise redemption_code_generation_error


async def get_redemption_or_404(code: str) -> RedemptionCode:
    redemption = await RedemptionCode.find_one(RedemptionCode.code == code)
    if redemption is None:
        raise redemption_code_not_found_error
    return redemption


async def get_user_redemption_or_404(
    user_id: PydanticObjectId, code: str
) -> RedemptionCode:
    redemption = await RedemptionCode.find_one(
        RedemptionCode.code == code,
        RedemptionCode.user_id == user_id,
    )
    if redemption is None:
        raise redemption_code_not_found_error
    return redemption


async def list_user_active_redemptions(
    user_id: PydanticObjectId,
) -> list[RedemptionCode]:
    return (
        await RedemptionCode.find(
            RedemptionCode.user_id == user_id,
            RedemptionCode.status == RedemptionCodeStatus.ACTIVE,
        )
        .sort("-created_at")
        .to_list()
    )


async def build_redemption_items(
    selections: list[tuple[PydanticObjectId, int]],
) -> tuple[list[RedemptionPrizeItem], int]:
    quantities: OrderedDict[PydanticObjectId, int] = OrderedDict()
    for prize_id, quantity in selections:
        quantities[prize_id] = quantities.get(prize_id, 0) + quantity

    prize_ids = list(quantities)
    prizes = await Prize.find({"_id": {"$in": prize_ids}, "is_active": True}).to_list()
    prizes_by_id = {prize.id: prize for prize in prizes}

    if len(prizes_by_id) != len(prize_ids):
        raise prize_not_found_error

    items: list[RedemptionPrizeItem] = []
    requested_points = 0
    for prize_id, quantity in quantities.items():
        prize = prizes_by_id.get(prize_id)
        if prize is None:
            raise prize_not_found_error

        item = RedemptionPrizeItem(
            prize_id=prize.id,
            title=prize.title,
            points_cost=prize.points_cost,
            quantity=quantity,
        )
        items.append(item)
        requested_points += item.total_points

    return items, requested_points
