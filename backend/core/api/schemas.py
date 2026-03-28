from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr, Field, HttpUrl

from core.domain.rewards import RedemptionCodeStatus, RouteType
from core.domain.shared import RedemptionPrizeItem
from core.domain.streaks import StreakKey


class PlaceRead(BaseModel):
    id: PydanticObjectId
    title: str
    reward_points: int
    latitude: float
    longitude: float


class RouteRead(BaseModel):
    id: PydanticObjectId
    title: str
    description: str
    route_type: RouteType
    reward_points_on_completion: int
    price_rub: int
    places_total: int
    places: list[PlaceRead]
    is_purchased: bool | None = None
    is_available: bool | None = None
    is_active: bool | None = None
    is_completed: bool | None = None
    scanned_places_count: int | None = None


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
    active_route_id: PydanticObjectId | None = None
    purchased_route_ids: list[PydanticObjectId] = Field(default_factory=list)


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
    status: str
    message: str
    route: "ScanRouteRead"
    point: "ScanPointRead"
    streak: "ScanStreakRead"
    avatar: "ScanAvatarRead"
    route_progress: "ScanRouteProgressRead"
    reward_points: "ScanRewardPointsRead"
    ai: "ScanAIRead"
    completed_at: datetime | None = None


class ScanRouteRead(BaseModel):
    id: PydanticObjectId
    title: str
    current_route_id: PydanticObjectId | None = None


class ScanPointRead(BaseModel):
    id: PydanticObjectId
    title: str


class ScanStreakRead(BaseModel):
    days: int
    changed: bool


class ScanAvatarRead(BaseModel):
    state: StreakKey
    changed: bool


class ScanRouteProgressRead(BaseModel):
    completed_points: int
    total_points: int
    is_completed: bool


class ScanRewardPointsRead(BaseModel):
    scan_gained: int
    completion_bonus_gained: int
    total_balance: int


class ScanAIRead(BaseModel):
    fact: str
    fallback: bool


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


class PaymentRead(BaseModel):
    route_id: PydanticObjectId
    payment_id: str | None = None
    payment_status: str
    amount_rub: int
    confirmation_url: str | None = None
    purchased_at: datetime
    confirmed_at: datetime | None = None
    is_confirmed: bool


class UserProfileRead(UserRead):
    active_redemptions: list[RedemptionCodeRead] = Field(default_factory=list)
    payments: list[PaymentRead] = Field(default_factory=list)


class RoutePaymentRequest(BaseModel):
    return_url: HttpUrl


class RouteSelectionRead(BaseModel):
    route_id: PydanticObjectId
    is_active: bool


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
