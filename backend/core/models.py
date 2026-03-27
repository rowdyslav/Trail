from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from beanie import Document, Indexed, Link, PydanticObjectId
from passlib.context import CryptContext
from pydantic import Field
from pymongo import IndexModel

from .schemas import PointRead, RouteRead, UserRead
from .streaks import StreakKey, calculate_streak_key

pwd_ctx = CryptContext(schemes=["argon2", "bcrypt"])


class User(Document):
    """MVP-модель пользователя приложения."""

    email: Annotated[str, Indexed(unique=True)]
    username: Annotated[str, Indexed(unique=True)]
    hashed_password: str
    streak_days: int = 0
    streak_key: StreakKey = StreakKey.NOVICE
    last_completed_at: datetime | None = None

    class Settings:
        name = "users"

    def sync_streak_key(self) -> None:
        self.streak_key = calculate_streak_key(self.streak_days)

    def to_read(self) -> UserRead:
        return UserRead(**self.model_dump())

    @classmethod
    def hash_password(cls, plain_password: str) -> str:
        return pwd_ctx.hash(plain_password)

    async def verify_password(self, password: str) -> bool:
        valid, new_hash = pwd_ctx.verify_and_update(password, self.hashed_password)
        if new_hash is not None:
            self.hashed_password = new_hash
            await self.save()
        return valid


class Point(Document):
    """MVP-модель точки маршрута."""

    title: str
    qr_code_value: str = Field(unique=True)

    class Settings:
        name = "points"

    def to_read(self) -> PointRead:
        return PointRead(id=self.id, title=self.title)


class Route(Document):
    """MVP-модель маршрута."""

    title: str
    description: str
    points: list[Link[Point]] = Field(default_factory=list)

    class Settings:
        name = "routes"

    def to_read(self) -> RouteRead:
        return RouteRead(
            id=self.id,
            title=self.title,
            description=self.description,
            points=[point.to_read() for point in self.points],
        )


class PointCompletionHistory(Document):
    """История уникальных завершений точек."""

    user_id: PydanticObjectId
    point_id: PydanticObjectId
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "point_completion_history"
        indexes = [
            IndexModel([("user_id", 1), ("point_id", 1)], unique=True),
        ]
