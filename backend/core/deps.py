from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm

from .auth import login_manager
from .models import User

AuthForm = Annotated[OAuth2PasswordRequestForm, Depends()]
CurrentUser = Annotated[User, Depends(login_manager)]
