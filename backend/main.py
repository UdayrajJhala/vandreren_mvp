"""
Vandreren Travel API - Main Application
Modular FastAPI backend for AI-powered travel planning with group collaboration
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import database and models to ensure tables are created
from models.database import Base, engine
from models import user, conversation, itinerary, group, progress, notification

# Import routers
from routes import (
    auth_router,
    chat_router,
    itinerary_router,
    groups_router,
    notifications_router,
    progress_router,
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Vandreren Travel API",
    version="1.0.0",
    description="AI-powered travel planning with group collaboration features",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with appropriate prefixes and tags
# Note: Using empty prefixes to maintain backward compatibility with old API paths
app.include_router(auth_router, prefix="", tags=["Authentication"])
app.include_router(chat_router, prefix="", tags=["Chat & Conversations"])
app.include_router(itinerary_router, prefix="", tags=["Itineraries"])
app.include_router(groups_router, prefix="/groups", tags=["Travel Groups"])
app.include_router(
    notifications_router, prefix="/notifications", tags=["Notifications"]
)
app.include_router(progress_router, prefix="", tags=["Activity Progress"])


@app.get("/", tags=["Root"])
async def root():
    """API root endpoint - health check and service info"""
    return {
        "message": "Welcome to Vandreren Travel API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs",
        "redoc": "/redoc",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
