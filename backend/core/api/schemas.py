from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr, Field

from core.domain.rewards import RedemptionCodeStatus, RouteType
from core.domain.shared import RedemptionPrizeItem
from core.domain.streaks import StreakKey


class PlaceRead(BaseModel):
    id: PydanticObjectId
    title: str


class RouteRead(BaseModel):
    id: PydanticObjectId
    title: str
    description: str
    route_type: RouteType
    reward_points_on_completion: int
    places_total: int
    places: list[PlaceRead]


class PrizeRead(BaseModel):
    id: PydanticObjectId
    title: str
    description: str
    points_cost: int
    is_active: bool


class UserRead(BaseModel):
    id: PydanticObjectId
    email: EmailStr
    streak_days: int
    streak_key: StreakKey
    reward_points: int


class BearerToken(BaseModel):
    access_token: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class AdminLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class ScanRequest(BaseModel):
    qr_code_value: str


class ScanResponse(BaseModel):
    success: bool
    already_scanned: bool
    route_id: PydanticObjectId
    route_completed: bool
    reward_granted: bool
    reward_points_granted: int
    user: UserRead
    place: PlaceRead
    completed_at: datetime | None = None


class RedemptionPrizeSelection(BaseModel):
    prize_id: PydanticObjectId
    quantity: int = Field(gt=0)


class RedemptionRequest(BaseModel):
    items: list[RedemptionPrizeSelection] = Field(min_length=1)


class RedemptionCodeRead(BaseModel):
    code: str
    status: RedemptionCodeStatus
    requested_points: int
    created_at: datetime
    used_at: datetime | None = None
    cancelled_at: datetime | None = None
    items: list[RedemptionPrizeItem]


class UserProfileRead(UserRead):
    active_redemptions: list[RedemptionCodeRead] = Field(default_factory=list)


class RedemptionValidationRead(BaseModel):
    code: str
    status: RedemptionCodeStatus
    requested_points: int
    created_at: datetime
    user: UserRead
    items: list[RedemptionPrizeItem]
    can_confirm: bool


class RedemptionConfirmRead(BaseModel):
    code: str
    status: RedemptionCodeStatus
    used_at: datetime
    deducted_points: int
    user: UserRead
    items: list[RedemptionPrizeItem]
