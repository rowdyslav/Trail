from passlib.context import CryptContext
from pydantic import BaseModel

pwd_ctx = CryptContext(schemes=["argon2", "bcrypt"])


class PasswordMixin:
    """Общая логика для работы с паролем."""

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
    """Контекст запроса на списание баллов."""

    place: str | None = None
    item: str | None = None
    note: str | None = None
