from fastapi_login import LoginManager

from env import ENV

from .models import User

login_manager = LoginManager(ENV.auth_secret, "/auth/login")


@login_manager.user_loader()
async def load_user(email: str) -> User | None:
    return await User.find_one(User.email == email)
