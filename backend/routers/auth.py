from fastapi import APIRouter, status

from core.api.errors import (
    ber,
    invalid_credentials_error,
    user_already_exists_error,
)
from core.api.schemas import BearerToken
from core.auth import login_manager
from core.deps import AuthForm
from core.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    responses=ber(user_already_exists_error),
)
async def register(data: AuthForm) -> BearerToken:
    user_existed = (
        await User.find_one(User.email == data.username) is not None
    )
    if user_existed:
        raise user_already_exists_error

    await User(
        email=data.username,
        hashed_password=User.hash_password(data.password),
    ).insert()

    return BearerToken(
        access_token=login_manager.create_access_token(data={"sub": data.email})
    )


@router.post(
    "/login",
    responses=ber(invalid_credentials_error),
)
async def login(data: AuthForm) -> BearerToken:
    email = data.username
    password = data.password

    user = await User.find_one(User.email == email)
    if user is None or not await user.verify_password(password):
        raise invalid_credentials_error

    return BearerToken(
        access_token=login_manager.create_access_token(data={"sub": email})
    )
