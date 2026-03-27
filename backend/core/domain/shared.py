from beanie import PydanticObjectId
from passlib.context import CryptContext
from pydantic import BaseModel, Field

pwd_ctx = CryptContext(schemes=["argon2", "bcrypt"])


class PasswordMixin:
    """Shared password helpers."""

    hashed_password: str

    @classmethod
    def hash_password(cls, plain_password: str) -> str:
        return pwd_ctx.hash(plain_password)

    async def verify_password(self, password: str) -> bool:
        valid, new_hash = pwd_ctx.verify_and_update(password, self.hashed_password)
        if new_hash is not None:
            self.hashed_password = new_hash
            await self.save()
        return valid


class RedemptionContext(BaseModel):
    """Optional metadata for a redemption request."""

    place: str | None = None
    item: str | None = None
    note: str | None = None


class RedemptionPrizeItem(BaseModel):
    """Snapshot of a selected prize inside a redemption code."""

    prize_id: PydanticObjectId
    title: str
    points_cost: int = Field(gt=0)
    quantity: int = Field(gt=0)

    @property
    def total_points(self) -> int:
        return self.points_cost * self.quantity
