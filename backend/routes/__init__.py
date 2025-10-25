"""Routes package for Vandreren Travel API"""

from .auth import router as auth_router
from .chat import router as chat_router
from .itinerary import router as itinerary_router
from .groups import router as groups_router
from .notifications import router as notifications_router
from .progress import router as progress_router

__all__ = [
    "auth_router",
    "chat_router",
    "itinerary_router",
    "groups_router",
    "notifications_router",
    "progress_router",
]
