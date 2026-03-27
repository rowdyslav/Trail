import json
from pathlib import Path
from typing import Optional


DATASET_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "ryazan_places_dataset.json"


def load_places_dataset() -> list[dict[str, str]]:
    return json.loads(DATASET_PATH.read_text(encoding="utf-8"))


def find_place_by_name(place_name: str) -> Optional[dict[str, str]]:
    normalized = place_name.strip().lower()
    for item in load_places_dataset():
        if item.get("place_name", "").strip().lower() == normalized:
            return item
    return None
