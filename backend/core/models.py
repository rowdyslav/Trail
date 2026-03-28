from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from beanie import Document, Indexed, Link, PydanticObjectId
from pydantic import EmailStr, Field, model_validator
from pymongo import IndexModel

from .api.schemas import (
    CodeRead,
    PaymentRead,
    PlaceRead,
    PrizeRead,
    RouteRead,
    UserProfileRead,
    UserRead,
)
from .domain.rewards import CodeStatus, RouteType, generate_code
from .domain.shared import CodePrizeItem, PasswordMixin
from .domain.streaks import StreakKey, calculate_streak_key


class User(PasswordMixin, Document):
    email: Annotated[EmailStr, Indexed(unique=True)]
    hashed_password: str
    is_active: bool = True
    streak_days: int = 0
    streak_key: StreakKey = StreakKey.NOVICE
    reward_points: int = 0
    last_completed_at: datetime | None = None
    active_route_id: PydanticObjectId | None = None
    purchased_route_ids: list[PydanticObjectId] = Field(default_factory=list)

    class Settings:
        name = "users"

    def sync_streak_key(self) -> None:
        self.streak_key = calculate_streak_key(self.streak_days)

    def to_read(self) -> UserRead:
        return UserRead(**self.model_dump())

    def to_profile_read(
        self,
        *,
        active_codes: list[CodeRead],
        payments: list[PaymentRead],
    ) -> UserProfileRead:
        return UserProfileRead(
            **self.model_dump(),
            active_codes=active_codes,
            payments=payments,
        )


class Admin(PasswordMixin, Document):
    email: Annotated[EmailStr, Indexed(unique=True)]
    hashed_password: str
    is_active: bool = True
    title: str = "Администратор"

    class Settings:
        name = "admins"


class Place(Document):
    title: str
    qr_code_value: str = Field(unique=True)
    reward_points: int = Field(default=0, ge=0)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    class Settings:
        name = "places"

    def to_read(self) -> PlaceRead:
        return PlaceRead(
            id=self.id,
            title=self.title,
            reward_points=self.reward_points,
            latitude=self.latitude,
            longitude=self.longitude,
        )


class Route(Document):
    title: str
    description: str
    route_type: RouteType = RouteType.FREE
    reward_points_on_completion: int = Field(default=0, ge=0)
    price_rub: int = Field(default=0, ge=0)
    places: list[Link[Place]] = Field(default_factory=list)

    class Settings:
        name = "routes"

    @model_validator(mode="after")
    def validate_pricing(self) -> Route:
        if self.route_type == RouteType.FREE:
            self.price_rub = 0
        elif self.price_rub <= 0:
            raise ValueError("Paid routes must have positive price_rub")
        return self

    def has_place(self, place_id: PydanticObjectId) -> bool:
        return any(place.id == place_id for place in self.places)

    def to_read(self) -> RouteRead:
        return RouteRead(
            id=self.id,
            title=self.title,
            description=self.description,
            route_type=self.route_type,
            reward_points_on_completion=self.reward_points_on_completion,
            price_rub=self.price_rub,
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


class WalkScans(Document):
    user_id: PydanticObjectId
    route_id: PydanticObjectId
    place_id: PydanticObjectId
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "walk_scans"
        indexes = [
            IndexModel([("user_id", 1), ("route_id", 1), ("place_id", 1)], unique=True),
            IndexModel([("user_id", 1), ("route_id", 1)]),
        ]


class Walk(Document):
    user_id: PydanticObjectId
    route_id: PydanticObjectId
    scanned_place_ids: list[PydanticObjectId] = Field(default_factory=list)
    is_completed: bool = False
    completed_at: datetime | None = None

    class Settings:
        name = "walks"
        indexes = [
            IndexModel([("user_id", 1), ("route_id", 1)], unique=True),
        ]


class Payment(Document):
    user_id: PydanticObjectId
    route_id: PydanticObjectId
    payment_id: str | None = None
    payment_status: str = "pending"
    amount_rub: int = Field(ge=0)
    purchased_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    confirmed_at: datetime | None = None

    class Settings:
        name = "payments"
        indexes = [
            IndexModel([("user_id", 1), ("route_id", 1)], unique=True),
            IndexModel([("payment_id", 1)], unique=True, sparse=True),
        ]

    def is_confirmed(self) -> bool:
        return self.payment_status == "succeeded" and self.confirmed_at is not None

    def to_read(self, *, confirmation_url: str | None = None) -> PaymentRead:
        return PaymentRead(
            route_id=self.route_id,
            payment_id=self.payment_id,
            payment_status=self.payment_status,
            amount_rub=self.amount_rub,
            confirmation_url=confirmation_url,
            purchased_at=self.purchased_at,
            confirmed_at=self.confirmed_at,
            is_confirmed=self.is_confirmed(),
        )


class Code(Document):
    user_id: PydanticObjectId
    value: Annotated[str, Indexed(unique=True)] = Field(
        default_factory=generate_code
    )
    status: CodeStatus = CodeStatus.ACTIVE
    requested_points: int = Field(gt=0)
    items: list[CodePrizeItem] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    used_at: datetime | None = None
    cancelled_at: datetime | None = None

    class Settings:
        name = "codes"
        indexes = [
            IndexModel([("user_id", 1), ("status", 1)]),
        ]

    def to_read(self) -> CodeRead:
        return CodeRead(
            code=self.value,
            status=self.status,
            requested_points=self.requested_points,
            created_at=self.created_at,
            used_at=self.used_at,
            cancelled_at=self.cancelled_at,
            items=self.items,
        )
