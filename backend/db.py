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
    RoutePlaceCompletion,
    RoutePurchase,
    User,
    UserRouteProgress,
)
from env import ENV

client = AsyncMongoClient(ENV.mongo_url, uuidRepresentation="standard")
db = client[ENV.mongo_database_name]

DEMO_PLACES = (
    {
        "title": "Рязанский кремль",
        "qr_code_value": "ryazan-kremlin-001",
        "reward_points": 40,
        "latitude": 54.6299,
        "longitude": 39.7416,
    },
    {
        "title": "Соборная колокольня",
        "qr_code_value": "sobornaya-belltower-002",
        "reward_points": 35,
        "latitude": 54.6307,
        "longitude": 39.7494,
    },
    {
        "title": "Улица Почтовая",
        "qr_code_value": "pochtovaya-street-003",
        "reward_points": 25,
        "latitude": 54.6255,
        "longitude": 39.7443,
    },
    {
        "title": "Государственный музей-заповедник С. А. Есенина",
        "qr_code_value": "esenin-museum-001",
        "reward_points": 60,
        "latitude": 54.8894,
        "longitude": 39.4472,
    },
    {
        "title": "Казанская церковь в Константинове",
        "qr_code_value": "kazan-church-konstantinovo-002",
        "reward_points": 45,
        "latitude": 54.8906,
        "longitude": 39.4518,
    },
    {
        "title": "Смотровая площадка над Окой",
        "qr_code_value": "oka-viewpoint-003",
        "reward_points": 30,
        "latitude": 54.8882,
        "longitude": 39.4594,
    },
    {
        "title": "Национальный парк «Мещера»",
        "qr_code_value": "meshchera-park-001",
        "reward_points": 55,
        "latitude": 55.1368,
        "longitude": 40.1763,
    },
    {
        "title": "Музей Сергея Есенина в Спас-Клепиках",
        "qr_code_value": "esenin-museum-klepiki-002",
        "reward_points": 35,
        "latitude": 55.1339,
        "longitude": 40.1801,
    },
    {
        "title": "Озеро Белое",
        "qr_code_value": "beloe-lake-003",
        "reward_points": 30,
        "latitude": 55.1408,
        "longitude": 40.2174,
    },
)

DEMO_ROUTES = (
    {
        "title": "Исторический центр Рязани",
        "description": "Небольшой маршрут по главным достопримечательностям центра Рязани.",
        "route_type": RouteType.FREE,
        "price_rub": 0,
        "reward_points_on_completion": 0,
        "place_refs": (
            "ryazan-kremlin-001",
            "sobornaya-belltower-002",
            "pochtovaya-street-003",
        ),
    },
    {
        "title": "По есенинским местам",
        "description": "Маршрут по знаковым точкам, связанным с Сергеем Есениным и селом Константиново.",
        "route_type": RouteType.PAID,
        "price_rub": 399,
        "reward_points_on_completion": 220,
        "place_refs": (
            "ryazan-kremlin-001",
            "esenin-museum-001",
            "kazan-church-konstantinovo-002",
            "oka-viewpoint-003",
        ),
    },
    {
        "title": "Прогулка по Мещерскому краю",
        "description": "Маршрут по природным и культурным точкам Спас-Клепиковского района.",
        "route_type": RouteType.PAID,
        "price_rub": 349,
        "reward_points_on_completion": 180,
        "place_refs": (
            "meshchera-park-001",
            "esenin-museum-klepiki-002",
            "beloe-lake-003",
            "pochtovaya-street-003",
        ),
    },
)

DEMO_PRIZES = (
    {
        "title": "Кружка Trail",
        "description": "Фирменная керамическая кружка.",
        "points_cost": 120,
        "is_active": True,
    },
    {
        "title": "Шоппер Trail",
        "description": "Многоразовая фирменная сумка для прогулок и поездок.",
        "points_cost": 180,
        "is_active": True,
    },
    {
        "title": "Набор стикеров Trail",
        "description": "Небольшой набор фирменных наклеек.",
        "points_cost": 60,
        "is_active": True,
    },
)

DEMO_ADMINS = (
    {
        "email": "admin@example.com",
        "title": "Демо-администратор",
        "password": "admin123",
    },
)


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
    places_by_qr_code: dict[str, Place] = {}
    for place_data in DEMO_PLACES:
        place = await Place(**place_data).insert()
        places_by_qr_code[place.qr_code_value] = place

    for route_data in DEMO_ROUTES:
        places = [places_by_qr_code[place_ref] for place_ref in route_data["place_refs"]]
        await Route(
            title=route_data["title"],
            description=route_data["description"],
            route_type=route_data["route_type"],
            price_rub=route_data["price_rub"],
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
    await reset_gameplay_data()
    await seed_demo_routes()
    await seed_demo_prizes()
    await seed_demo_admins()


async def reset_gameplay_data() -> None:
    await PlaceCompletionHistory.get_pymongo_collection().delete_many({})
    await RoutePlaceCompletion.get_pymongo_collection().delete_many({})
    await UserRouteProgress.get_pymongo_collection().delete_many({})
    await RouteCompletion.get_pymongo_collection().delete_many({})
    await RoutePurchase.get_pymongo_collection().delete_many({})
    await RedemptionCode.get_pymongo_collection().delete_many({})
    await Route.get_pymongo_collection().delete_many({})
    await Place.get_pymongo_collection().delete_many({})
    await User.get_pymongo_collection().update_many({}, {"$set": {"active_route_id": None}})


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
            RoutePlaceCompletion,
            UserRouteProgress,
            RouteCompletion,
            RoutePurchase,
            RedemptionCode,
        ],
    )
    await seed_data()
