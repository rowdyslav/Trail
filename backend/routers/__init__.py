"""Все роутеры приложения."""

from fastapi import APIRouter

from .admin import router as admin_router
from .auth import router as auth_router
from .me import router as me_router
from .redemptions import router as redemptions_router
from .routes import router as routes_router
from .scan import router as scan_router

all_routers = APIRouter()
for router in [
    admin_router,
    auth_router,
    me_router,
    routes_router,
    scan_router,
    redemptions_router,
]:
    all_routers.include_router(router)
