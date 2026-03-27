from beanie import init_beanie
from pymongo import AsyncMongoClient

from core import Point, PointCompletionHistory, Route, User
from env import ENV

client = AsyncMongoClient(ENV.mongo_url, uuidRepresentation="standard")
db = client[ENV.mongo_database_name]

DEMO_ROUTES = (
    {
        "title": "Исторический центр",
        "description": (
            "Короткий маршрут по главным точкам центра города."
        ),
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
        "description": (
            "Неспешный маршрут по зелёной зоне с QR-чекпоинтами."
        ),
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


async def has_actual_demo_data() -> bool:
    routes = await Route.find({}, fetch_links=True).to_list()
    points = await Point.find_all().to_list()

    if len(routes) != len(DEMO_ROUTES):
        return False
    if len(points) != sum(len(route["points"]) for route in DEMO_ROUTES):
        return False
    if any(not route.points for route in routes):
        return False

    actual_qr_codes = {point.qr_code_value for point in points}
    expected_qr_codes = {
        point["qr_code_value"]
        for route in DEMO_ROUTES
        for point in route["points"]
    }
    return actual_qr_codes == expected_qr_codes


async def recreate_demo_data() -> None:
    await PointCompletionHistory.get_pymongo_collection().delete_many({})
    await Route.get_pymongo_collection().delete_many({})
    await Point.get_pymongo_collection().delete_many({})

    for route_data in DEMO_ROUTES:
        points = [
            await Point(**point_data).insert()
            for point_data in route_data["points"]
        ]

        await Route(
            title=route_data["title"],
            description=route_data["description"],
            points=points,
        ).insert()


async def seed_data() -> None:
    if await has_actual_demo_data():
        return

    await recreate_demo_data()


async def init_db() -> None:
    await init_beanie(
        database=db,
        document_models=[User, Route, Point, PointCompletionHistory],
    )
    await seed_data()
