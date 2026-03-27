from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PlaceRecord:
    id: int
    place_name: str
    description: str
