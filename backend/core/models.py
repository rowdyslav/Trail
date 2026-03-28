from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from beanie import Document, Indexed, Link, PydanticObjectId
from pydantic import EmailStr, Field
from pymongo import IndexModel

from .api.schemas import (
    PlaceRead,
    PrizeRead,
    RedemptionCodeRead,
    RouteRead,
    UserProfileRead,
    UserRead,
)
from .domain.rewards import RedemptionCodeStatus, RouteType, generate_redemption_code
from .domain.shared import PasswordMixin, RedemptionPrizeItem
from .domain.streaks import StreakKey, calculate_streak_key


class User(PasswordMixin, Document):
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

    def to_profile_read(
        self, active_redemptions: list[RedemptionCodeRead]
    ) -> UserProfileRead:
        return UserProfileRead(
            **self.model_dump(), active_redemptions=active_redemptions
        )


class Admin(PasswordMixin, Document):
    email: Annotated[EmailStr, Indexed(unique=True)]
    hashed_password: str

    class Settings:
        name = "admins"


class Place(Document):
    title: str
    qr_code_value: str = Field(unique=True)

    class Settings:
        name = "places"

    def to_read(self) -> PlaceRead:
        return PlaceRead(id=self.id, title=self.title)


class Route(Document):
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


class Prize(Document):
    title: str
    description: str
    points_cost: int = Field(gt=0)
    is_active: bool = True

    class Settings:
        name = "prizes"

    def to_read(self) -> PrizeRead:
        return PrizeRead(
            id=self.id,
            title=self.title,
            description=self.description,
            points_cost=self.points_cost,
            is_active=self.is_active,
        )


class PlaceCompletionHistory(Document):
    user_id: PydanticObjectId
    place_id: PydanticObjectId
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "place_completion_history"
        indexes = [
            IndexModel([("user_id", 1), ("place_id", 1)], unique=True),
        ]


class RouteCompletion(Document):
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
    user_id: PydanticObjectId
    code: Annotated[str, Indexed(unique=True)] = Field(
        default_factory=generate_redemption_code
    )
    status: RedemptionCodeStatus = RedemptionCodeStatus.ACTIVE
    requested_points: int = Field(gt=0)
    items: list[RedemptionPrizeItem] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    used_at: datetime | None = None
    cancelled_at: datetime | None = None

    class Settings:
        name = "redemption_codes"
        indexes = [
            IndexModel([("user_id", 1), ("status", 1)]),
        ]

    def to_read(self) -> RedemptionCodeRead:
        return RedemptionCodeRead(
            code=self.code,
            status=self.status,
            requested_points=self.requested_points,
            created_at=self.created_at,
            used_at=self.used_at,
            cancelled_at=self.cancelled_at,
            items=self.items,
        )
