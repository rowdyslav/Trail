"""Все роутеры приложения."""

from fastapi import APIRouter

from .auth import router as auth_router
from .me import router as me_router
from .routes import router as routes_router
from .scan import router as scan_router

all_routers = APIRouter()
for router in [auth_router, me_router, routes_router, scan_router]:
    all_routers.include_router(router)
