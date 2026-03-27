from beanie import init_beanie
from pymongo import AsyncMongoClient

from core.domain.rewards import RouteType
from core.models import (
    Admin,
    Place,
    PlaceCompletionHistory,
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
        "places": (
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
        "places": (
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
    places = await Place.find_all().to_list()

    if len(routes) != len(DEMO_ROUTES):
        return False
    if len(places) != sum(len(route["places"]) for route in DEMO_ROUTES):
        return False
    if any(len(route.places) == 0 for route in routes):
        return False

    actual_route_signatures = {
        (
            route.title,
            route.route_type,
            route.reward_points_on_completion,
            tuple(place.qr_code_value for place in route.places),
        )
        for route in routes
    }
    expected_route_signatures = {
        (
            route["title"],
            route["route_type"],
            route["reward_points_on_completion"],
            tuple(place["qr_code_value"] for place in route["places"]),
        )
        for route in DEMO_ROUTES
    }
    return actual_route_signatures == expected_route_signatures


async def seed_demo_routes() -> None:
    if await has_actual_demo_data():
        return

    await PlaceCompletionHistory.get_pymongo_collection().delete_many({})
    await RouteCompletion.get_pymongo_collection().delete_many({})
    await RedemptionCode.get_pymongo_collection().delete_many({})
    await Route.get_pymongo_collection().delete_many({})
    await Place.get_pymongo_collection().delete_many({})

    for route_data in DEMO_ROUTES:
        places = [
            await Place(**place_data).insert() for place_data in route_data["places"]
        ]
        await Route(
            title=route_data["title"],
            description=route_data["description"],
            route_type=route_data["route_type"],
            reward_points_on_completion=route_data["reward_points_on_completion"],
            places=places,
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
            Place,
            PlaceCompletionHistory,
            RouteCompletion,
            RedemptionCode,
        ],
    )
    await seed_data()
