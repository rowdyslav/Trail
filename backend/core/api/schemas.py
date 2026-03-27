from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr, Field

from core.domain.rewards import RedemptionCodeStatus, RouteType
from core.domain.shared import RedemptionContext
from core.domain.streaks import StreakKey


class PointRead(BaseModel):
    """Точка маршрута в ответе API."""

    id: PydanticObjectId
    title: str


class RouteRead(BaseModel):
    """Маршрут с базовой информацией для клиента."""

    id: PydanticObjectId
    title: str
    description: str
    route_type: RouteType
    reward_points_on_completion: int
    points_total: int
    points: list[PointRead]


class UserRead(BaseModel):
    """Публичное представление пользователя."""

    id: PydanticObjectId
    email: EmailStr
    username: str
    streak_days: int
    streak_key: StreakKey
    reward_points: int


class BearerToken(BaseModel):
    """Токен авторизации."""

    access_token: str


class UserRegister(BaseModel):
    """Данные для регистрации пользователя."""

    email: EmailStr
    username: str = Field(max_length=20)
    password: str = Field(min_length=6)


class AdminRead(BaseModel):
    """Публичное представление администратора."""

    id: PydanticObjectId
    email: EmailStr
    title: str


class AdminLogin(BaseModel):
    """Данные для входа администратора."""

    email: EmailStr
    password: str = Field(min_length=6)


class ScanRequest(BaseModel):
    """Данные запроса на сканирование QR."""

    qr_code_value: str


class ScanResponse(BaseModel):
    """Результат обработки скана."""

    success: bool
    already_scanned: bool
    route_id: PydanticObjectId
    route_completed: bool
    reward_granted: bool
    reward_points_granted: int
    user: UserRead
    point: PointRead
    completed_at: datetime | None = None


class RedemptionRequest(BaseModel):
    """Запрос пользователя на создание кода списания."""

    requested_points: int = Field(gt=0)
    context: RedemptionContext = Field(default_factory=RedemptionContext)


class RedemptionCodeRead(BaseModel):
    """Код списания для клиентской части."""

    code: str
    status: RedemptionCodeStatus
    requested_points: int
    expires_at: datetime
    context: RedemptionContext


class RedemptionValidationRead(BaseModel):
    """Ответ для проверки кода на стороне администратора."""

    code: str
    status: RedemptionCodeStatus
    requested_points: int
    expires_at: datetime
    user: UserRead
    context: RedemptionContext
    can_confirm: bool


class RedemptionConfirmRead(BaseModel):
    """Ответ после подтверждения списания."""

    code: str
    status: RedemptionCodeStatus
    used_at: datetime
    deducted_points: int
    user: UserRead
