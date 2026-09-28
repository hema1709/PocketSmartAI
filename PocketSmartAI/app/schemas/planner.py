from typing import Literal

from pydantic import BaseModel, Field


class HomeItem(BaseModel):
    category: str = Field(min_length=1, max_length=80)
    quantity: int = Field(default=1, ge=1, le=100)
    notes: str = Field(default="", max_length=300)


class HomeRequest(BaseModel):
    budget: float = Field(gt=0, le=10_000_000)
    room_type: str = Field(min_length=1, max_length=80)
    style: str = Field(default="modern", max_length=80)
    items: list[HomeItem] = Field(default_factory=list, max_length=30)


class PartyRequest(BaseModel):
    budget: float = Field(gt=0, le=10_000_000)
    guest_count: int = Field(gt=0, le=10000)
    event_type: str = Field(min_length=1, max_length=80)
    venue: str = Field(default="", max_length=200)
    city: str = Field(default="", max_length=100)
    preferences: str = Field(default="", max_length=500)


class JewelryRequest(BaseModel):
    budget: float = Field(gt=0, le=10_000_000)
    occasion: str = Field(min_length=1, max_length=80)
    style: str = Field(default="elegant", max_length=80)
    outfit_color: str = Field(default="", max_length=80)
    notes: str = Field(default="", max_length=500)


class RecommendationResponse(BaseModel):
    id: int
    planner_type: Literal["home", "party", "jewelry"]
    source: str
    budget: float
    allocations: dict
    recommendations: list[dict]
    ai_used: bool
