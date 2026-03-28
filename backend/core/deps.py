from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm

from core.auth import admin_login_manager, login_manager
from core.models import Admin, User

AuthForm = Annotated[OAuth2PasswordRequestForm, Depends()]
CurrentUser = Annotated[User, Depends(login_manager)]
CurrentUserOptional = Annotated[User | None, Depends(login_manager.optional)]
CurrentAdmin = Annotated[Admin, Depends(admin_login_manager)]
