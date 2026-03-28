from fastapi import APIRouter

from .admin import router as admin_router
from .auth import router as auth_router
from .codes import router as codes_router
from .me import router as me_router
from .prizes import router as prizes_router
from .routes import router as routes_router
from .scan import router as scan_router

all_routers = APIRouter()
for router in [
    admin_router,
    auth_router,
    me_router,
    prizes_router,
    routes_router,
    scan_router,
    codes_router,
]:
    all_routers.include_router(router)
