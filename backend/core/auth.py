from fastapi_login import LoginManager

from core.models import Admin, User
from env import ENV

login_manager = LoginManager(ENV.auth_secret, "/auth/login")
admin_login_manager = LoginManager(ENV.auth_secret, "/admin/auth/login")


@login_manager.user_loader()
async def load_user(email: str) -> User | None:
    return await User.find_one(User.email == email)


@admin_login_manager.user_loader()
async def load_admin(email: str) -> Admin | None:
    return await Admin.find_one(
        Admin.email == email,
        Admin.is_active == True,  # noqa: E712
    )
