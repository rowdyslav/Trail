from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.data.types import PlaceRecord


DATASET_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "ryazan_places_dataset.json"


def _normalize_place_name(place_name: str) -> str:
    return place_name.strip().lower()


@lru_cache(maxsize=1)
def load_places_dataset() -> tuple[PlaceRecord, ...]:
    raw_items = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    return tuple(
        PlaceRecord(
            id=int(item["id"]),
            place_name=str(item["place_name"]),
            description=str(item["description"]),
        )
        for item in raw_items
    )


@lru_cache(maxsize=1)
def get_places_index() -> dict[str, PlaceRecord]:
    return {
        _normalize_place_name(item["place_name"]): item
        for item in load_places_dataset()
    }


def find_place_by_name(place_name: str) -> PlaceRecord | None:
    return get_places_index().get(_normalize_place_name(place_name))
