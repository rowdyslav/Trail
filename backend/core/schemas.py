from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr, Field

from .streaks import StreakKey


class PointRead(BaseModel):
    """Точка маршрута в ответе API."""

    id: PydanticObjectId
    title: str


class RouteRead(BaseModel):
    """Маршрут со вложенными точками."""

    id: PydanticObjectId
    title: str
    description: str
    points: list[PointRead]


class UserRead(BaseModel):
    """Публичное представление пользователя."""

    id: PydanticObjectId
    email: EmailStr
    username: str
    streak_days: int
    streak_key: StreakKey


class BearerToken(BaseModel):
    """Токен авторизации."""

    access_token: str


class UserRegister(BaseModel):
    """Данные для регистрации пользователя."""

    email: EmailStr
    username: str = Field(max_length=20)
    password: str = Field(min_length=6)


class ScanRequest(BaseModel):
    """Данные запроса на сканирование QR."""

    qr_code_value: str


class ScanResponse(BaseModel):
    """Результат обработки скана."""

    success: bool
    already_scanned: bool
    user: UserRead
    point: PointRead
    completed_at: datetime | None = None
