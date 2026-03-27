from beanie import init_beanie
from pymongo import AsyncMongoClient

from core.domain.rewards import RouteType
from core.models import (
    Admin,
    Place,
    PlaceCompletionHistory,
    Prize,
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
        "title": "Historic center",
        "description": "Short route through the main landmarks in the city center.",
        "route_type": RouteType.FREE,
        "reward_points_on_completion": 0,
        "places": (
            {
                "title": "Old square",
                "qr_code_value": "center-square-001",
            },
            {
                "title": "City arch",
                "qr_code_value": "center-arch-002",
            },
        ),
    },
    {
        "title": "Park quest",
        "description": "Route through the green zone with a reward after full completion.",
        "route_type": RouteType.PAID,
        "reward_points_on_completion": 150,
        "places": (
            {
                "title": "Main park gate",
                "qr_code_value": "park-gate-001",
            },
            {
                "title": "Viewpoint",
                "qr_code_value": "park-view-002",
            },
        ),
    },
)

DEMO_PRIZES = (
    {
        "title": "Trail mug",
        "description": "Branded mug.",
        "points_cost": 120,
        "is_active": True,
    },
    {
        "title": "Trail shopper",
        "description": "Reusable branded tote bag.",
        "points_cost": 180,
        "is_active": True,
    },
    {
        "title": "Sticker pack",
        "description": "Small pack of branded stickers.",
        "points_cost": 60,
        "is_active": True,
    },
)

DEMO_ADMINS = (
    {
        "email": "admin@example.com",
        "title": "Demo admin",
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


async def has_actual_demo_prizes() -> bool:
    prizes = await Prize.find_all().to_list()
    if len(prizes) != len(DEMO_PRIZES):
        return False

    actual_prize_signatures = {
        (prize.title, prize.description, prize.points_cost, prize.is_active)
        for prize in prizes
    }
    expected_prize_signatures = {
        (
            prize["title"],
            prize["description"],
            prize["points_cost"],
            prize["is_active"],
        )
        for prize in DEMO_PRIZES
    }
    return actual_prize_signatures == expected_prize_signatures


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


async def seed_demo_prizes() -> None:
    if await has_actual_demo_prizes():
        return

    await Prize.get_pymongo_collection().delete_many({})

    for prize_data in DEMO_PRIZES:
        await Prize(**prize_data).insert()


async def seed_demo_admins() -> None:
    for admin_data in DEMO_ADMINS:
        existing_admin = await Admin.find_one(Admin.email == admin_data["email"])
        if existing_admin is not None:
            continue

        await Admin(
            email=admin_data["email"],
            title=admin_data["title"],
            hashed_password=Admin.hash_password(admin_data["password"]),
        ).insert()


async def seed_data() -> None:
    await seed_demo_routes()
    await seed_demo_prizes()
    await seed_demo_admins()


async def init_db() -> None:
    await init_beanie(
        database=db,
        document_models=[
            User,
            Admin,
            Route,
            Place,
            Prize,
            PlaceCompletionHistory,
            RouteCompletion,
            RedemptionCode,
        ],
    )
    await seed_data()
