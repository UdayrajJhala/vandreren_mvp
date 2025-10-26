from pydantic import BaseModel
from typing import Optional, Dict, Any


class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: str
    preferences: Optional[Dict[str, Any]] = {}


class UserLogin(BaseModel):
    username: str
    password: str


class UserPreferences(BaseModel):
    interests: Optional[list] = []
    travel_style: Optional[str] = "balanced"
    dietary_restrictions: Optional[list] = []
    budget_preference: Optional[str] = "mid-range"


class TripRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget: Optional[float] = None
    preferences: Optional[str] = None


class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[int] = None


class ItineraryUpdate(BaseModel):
    itinerary_id: int
    update_request: str


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""


class GroupInvite(BaseModel):
    user_email: str


class ActivityProgressUpdate(BaseModel):
    itinerary_id: int
    day: int
    activity_index: int
    completed: bool
    notes: Optional[str] = None
