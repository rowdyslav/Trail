from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .types import PlaceRecord

DATASET_PATH = Path(__file__).parent / "dataset.json"


def _normalize_place_name(place_name: str) -> str:
    return " ".join(place_name.strip().lower().split())


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


def get_place_description(place_name: str) -> str | None:
    record = find_place_by_name(place_name)
    if record is None:
        return None
    return record["description"]
