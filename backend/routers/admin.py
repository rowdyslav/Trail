from datetime import UTC, datetime

from fastapi import APIRouter

from core.api.errors import (
    admin_inactive_error,
    ber,
    insufficient_reward_points_error,
    invalid_credentials_error,
    redemption_code_expired_error,
    redemption_code_not_active_error,
    redemption_code_not_found_error,
    unauthorized_error,
)
from core.api.schemas import (
    AdminLogin,
    BearerToken,
    RedemptionConfirmRead,
    RedemptionValidationRead,
)
from core.auth import admin_login_manager
from core.deps import CurrentAdmin
from core.domain.redemptions import get_redemption_or_404, sync_redemption_status
from core.domain.rewards import RedemptionCodeStatus
from core.models import Admin, User

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post(
    "/auth/login",
    responses=ber(invalid_credentials_error, admin_inactive_error),
)
async def admin_login(data: AdminLogin) -> BearerToken:
    admin = await Admin.find_one(Admin.email == data.email)
    if admin is None or not await admin.verify_password(data.password):
        raise invalid_credentials_error
    if not admin.is_active:
        raise admin_inactive_error

    return BearerToken(
        access_token=admin_login_manager.create_access_token(data={"sub": admin.email})
    )


@router.post(
    "/redemptions/{code}/validate",
    responses=ber(
        unauthorized_error,
        redemption_code_not_found_error,
        redemption_code_not_active_error,
        redemption_code_expired_error,
    ),
)
async def validate_redemption_code(
    _: CurrentAdmin, code: str
) -> RedemptionValidationRead:
    redemption = await get_redemption_or_404(code)
    now = datetime.now(UTC)
    await sync_redemption_status(redemption, now)

    if redemption.status == RedemptionCodeStatus.EXPIRED:
        raise redemption_code_expired_error
    if redemption.status != RedemptionCodeStatus.ACTIVE:
        raise redemption_code_not_active_error

    user = await User.get(redemption.user_id)
    if user is None:
        raise redemption_code_not_found_error

    return RedemptionValidationRead(
        code=redemption.code,
        status=redemption.status,
        requested_points=redemption.requested_points,
        expires_at=redemption.expires_at,
        user=user.to_read(),
        context=redemption.context,
        can_confirm=user.reward_points >= redemption.requested_points,
    )


@router.post(
    "/redemptions/{code}/confirm",
    responses=ber(
        unauthorized_error,
        redemption_code_not_found_error,
        redemption_code_not_active_error,
        redemption_code_expired_error,
        insufficient_reward_points_error,
    ),
)
async def confirm_redemption_code(
    admin: CurrentAdmin, code: str
) -> RedemptionConfirmRead:
    redemption = await get_redemption_or_404(code)
    now = datetime.now(UTC)
    await sync_redemption_status(redemption, now)

    if redemption.status == RedemptionCodeStatus.EXPIRED:
        raise redemption_code_expired_error
    if redemption.status != RedemptionCodeStatus.ACTIVE:
        raise redemption_code_not_active_error

    user = await User.get(redemption.user_id)
    if user is None:
        raise redemption_code_not_found_error
    if user.reward_points < redemption.requested_points:
        raise insufficient_reward_points_error

    user.reward_points -= redemption.requested_points
    redemption.status = RedemptionCodeStatus.USED
    redemption.used_at = now
    redemption.used_by_admin_id = admin.id

    await user.save()
    await redemption.save()

    return RedemptionConfirmRead(
        code=redemption.code,
        status=redemption.status,
        used_at=redemption.used_at,
        deducted_points=redemption.requested_points,
        user=user.to_read(),
    )
