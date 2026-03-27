from beanie import init_beanie
from pymongo import AsyncMongoClient

from core.domain.rewards import RouteType
from core.models import (
    Admin,
    Point,
    PointCompletionHistory,
    RedemptionCode,
    Route,
    RouteCompletion,
    User,
)
from env import ENV

client = AsyncMongoClient(ENV.mongo_url, uuidRepresentation="standard")
db = client[ENV.mongo_database_name]

DEMO_ROUTES = (
    {
        "title": "Исторический центр",
        "description": "Короткий маршрут по главным точкам центра города.",
        "route_type": RouteType.FREE,
        "reward_points_on_completion": 0,
        "points": (
            {
                "title": "Старая площадь",
                "qr_code_value": "center-square-001",
            },
            {
                "title": "Городская арка",
                "qr_code_value": "center-arch-002",
            },
        ),
    },
    {
        "title": "Парковый квест",
        "description": "Маршрут по зеленой зоне с наградой после полного прохождения.",
        "route_type": RouteType.PAID,
        "reward_points_on_completion": 150,
        "points": (
            {
                "title": "Главный вход в парк",
                "qr_code_value": "park-gate-001",
            },
            {
                "title": "Смотровая площадка",
                "qr_code_value": "park-view-002",
            },
        ),
    },
)

DEMO_ADMINS = (
    {
        "email": "admin@example.com",
        "title": "Демо-админ",
        "password": "admin123",
    },
)


async def has_actual_demo_data() -> bool:
    routes = await Route.find({}, fetch_links=True).to_list()
    points = await Point.find_all().to_list()

    if len(routes) != len(DEMO_ROUTES):
        return False
    if len(points) != sum(len(route["points"]) for route in DEMO_ROUTES):
        return False
    if any(len(route.points) == 0 for route in routes):
        return False

    actual_route_signatures = {
        (
            route.title,
            route.route_type,
            route.reward_points_on_completion,
            tuple(point.qr_code_value for point in route.points),
        )
        for route in routes
    }
    expected_route_signatures = {
        (
            route["title"],
            route["route_type"],
            route["reward_points_on_completion"],
            tuple(point["qr_code_value"] for point in route["points"]),
        )
        for route in DEMO_ROUTES
    }
    return actual_route_signatures == expected_route_signatures


async def seed_demo_routes() -> None:
    if await has_actual_demo_data():
        return

    await PointCompletionHistory.get_pymongo_collection().delete_many({})
    await RouteCompletion.get_pymongo_collection().delete_many({})
    await RedemptionCode.get_pymongo_collection().delete_many({})
    await Route.get_pymongo_collection().delete_many({})
    await Point.get_pymongo_collection().delete_many({})

    for route_data in DEMO_ROUTES:
        points = [
            await Point(**point_data).insert() for point_data in route_data["points"]
        ]
        await Route(
            title=route_data["title"],
            description=route_data["description"],
            route_type=route_data["route_type"],
            reward_points_on_completion=route_data["reward_points_on_completion"],
            points=points,
        ).insert()


async def seed_demo_admins() -> None:
    for admin_data in DEMO_ADMINS:
        existing_admin = await Admin.find_one(
            Admin.email == admin_data["email"]
        )
        if existing_admin is not None:
            continue

        await Admin(
            email=admin_data["email"],
            title=admin_data["title"],
            hashed_password=Admin.hash_password(admin_data["password"]),
        ).insert()


async def seed_data() -> None:
    await seed_demo_routes()
    await seed_demo_admins()


async def init_db() -> None:
    await init_beanie(
        database=db,
        document_models=[
            User,
            Admin,
            Route,
            Point,
            PointCompletionHistory,
            RouteCompletion,
            RedemptionCode,
        ],
    )
    await seed_data()
