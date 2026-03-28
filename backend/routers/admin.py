from datetime import UTC, datetime

from fastapi import APIRouter

from core.api.errors import (
    admin_inactive_error,
    ber,
    code_not_active_error,
    code_not_found_error,
    invalid_credentials_error,
    unauthorized_error,
)
from core.api.schemas import (
    AdminLogin,
    BearerToken,
    CodeConfirmRead,
    CodeValidationRead,
)
from core.auth import admin_login_manager
from core.deps import CurrentAdmin
from core.domain.codes import get_code_or_404
from core.domain.rewards import CodeStatus
from core.models import Admin, User

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post(
    "/session",
    responses=ber(invalid_credentials_error, admin_inactive_error),
)
async def create_admin_session(data: AdminLogin) -> BearerToken:
    admin = await Admin.find_one(Admin.email == data.email)
    if admin is None or not await admin.verify_password(data.password):
        raise invalid_credentials_error
    if not admin.is_active:
        raise admin_inactive_error

    return BearerToken(
        access_token=admin_login_manager.create_access_token(data={"sub": admin.email})
    )


@router.get(
    "/codes/{code}",
    responses=ber(
        unauthorized_error,
        code_not_found_error,
        code_not_active_error,
    ),
)
async def read_code_validation(_: CurrentAdmin, code: str) -> CodeValidationRead:
    entry = await get_code_or_404(code)

    if entry.status != CodeStatus.ACTIVE:
        raise code_not_active_error

    user = await User.get(entry.user_id)
    if user is None:
        raise code_not_found_error

    return CodeValidationRead(
        code=entry.value,
        status=entry.status,
        requested_points=entry.requested_points,
        created_at=entry.created_at,
        user=user.to_read(),
        items=entry.items,
        can_confirm=True,
    )


@router.patch(
    "/codes/{code}",
    responses=ber(
        unauthorized_error,
        code_not_found_error,
        code_not_active_error,
    ),
)
async def confirm_code(_: CurrentAdmin, code: str) -> CodeConfirmRead:
    entry = await get_code_or_404(code)

    if entry.status != CodeStatus.ACTIVE:
        raise code_not_active_error

    user = await User.get(entry.user_id)
    if user is None:
        raise code_not_found_error

    entry.status = CodeStatus.USED
    entry.used_at = entry.used_at or datetime.now(UTC)
    await entry.save()

    return CodeConfirmRead(
        code=entry.value,
        status=entry.status,
        used_at=entry.used_at,
        deducted_points=entry.requested_points,
        user=user.to_read(),
        items=entry.items,
    )
