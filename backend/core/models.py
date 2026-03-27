from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from beanie import Document, Indexed, Link, PydanticObjectId
from pydantic import EmailStr, Field
from pymongo import IndexModel

from .api.schemas import (
    AdminRead,
    PlaceRead,
    RedemptionCodeRead,
    RouteRead,
    UserRead,
)
from .domain.rewards import RedemptionCodeStatus, RouteType, generate_redemption_code
from .domain.shared import PasswordMixin, RedemptionContext
from .domain.streaks import StreakKey, calculate_streak_key


class User(PasswordMixin, Document):
    """Пользователь приложения."""

    email: Annotated[EmailStr, Indexed(unique=True)]
    hashed_password: str
    streak_days: int = 0
    streak_key: StreakKey = StreakKey.NOVICE
    reward_points: int = 0
    last_completed_at: datetime | None = None

    class Settings:
        name = "users"

    def sync_streak_key(self) -> None:
        self.streak_key = calculate_streak_key(self.streak_days)

    def to_read(self) -> UserRead:
        return UserRead(**self.model_dump())

class Admin(PasswordMixin, Document):
    """Администратор для выдачи наград."""

    email: Annotated[EmailStr, Indexed(unique=True)]
    title: str
    hashed_password: str
    is_active: bool = True

    class Settings:
        name = "admins"

    def to_read(self) -> AdminRead:
        return AdminRead(id=self.id, email=self.email, title=self.title)

class Place(Document):
    """Место маршрута."""

    title: str
    qr_code_value: str = Field(unique=True)

    class Settings:
        name = "places"

    def to_read(self) -> PlaceRead:
        return PlaceRead(id=self.id, title=self.title)


class Route(Document):
    """Маршрут приложения."""

    title: str
    description: str
    route_type: RouteType = RouteType.FREE
    reward_points_on_completion: int = 0
    places: list[Link[Place]] = Field(default_factory=list)

    class Settings:
        name = "routes"

    def has_place(self, place_id: PydanticObjectId) -> bool:
        return any(place.id == place_id for place in self.places)

    def to_read(self) -> RouteRead:
        return RouteRead(
            id=self.id,
            title=self.title,
            description=self.description,
            route_type=self.route_type,
            reward_points_on_completion=self.reward_points_on_completion,
            places_total=len(self.places),
            places=[place.to_read() for place in self.places],
        )


class PlaceCompletionHistory(Document):
    """История уникальных завершений мест."""

    user_id: PydanticObjectId
    place_id: PydanticObjectId
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "place_completion_history"
        indexes = [
            IndexModel([("user_id", 1), ("place_id", 1)], unique=True),
        ]


class RouteCompletion(Document):
    """Фиксация полного завершения маршрута пользователем."""

    user_id: PydanticObjectId
    route_id: PydanticObjectId
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    reward_points_granted: int = 0

    class Settings:
        name = "route_completions"
        indexes = [
            IndexModel([("user_id", 1), ("route_id", 1)], unique=True),
        ]


class RedemptionCode(Document):
    """Код для списания баллов через администратора."""

    user_id: PydanticObjectId
    code: Annotated[str, Indexed(unique=True)] = Field(
        default_factory=generate_redemption_code
    )
    status: RedemptionCodeStatus = RedemptionCodeStatus.ACTIVE
    requested_points: int = Field(gt=0)
    context: RedemptionContext = Field(default_factory=RedemptionContext)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: datetime
    used_at: datetime | None = None
    cancelled_at: datetime | None = None
    used_by_admin_id: PydanticObjectId | None = None

    class Settings:
        name = "redemption_codes"
        indexes = [
            IndexModel([("user_id", 1), ("status", 1)]),
            IndexModel([("expires_at", 1)]),
        ]

    def is_expired(self, now: datetime) -> bool:
        return now >= self.expires_at

    def to_read(self) -> RedemptionCodeRead:
        return RedemptionCodeRead(
            code=self.code,
            status=self.status,
            requested_points=self.requested_points,
            expires_at=self.expires_at,
            context=self.context,
        )
