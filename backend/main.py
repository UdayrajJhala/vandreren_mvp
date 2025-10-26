"""
Vandreren Travel API - Main Application
Modular FastAPI backend for AI-powered travel planning with group collaboration
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

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

# Background scheduler for self-ping
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    scheduler.add_job(
        lambda: httpx.get("http://localhost:8000/ping", timeout=10.0),
        "interval",
        minutes=10,
        id="self_ping",
        replace_existing=True,
    )
    scheduler.start()
    print(f"[{datetime.now()}] Self-ping scheduler started - pinging every 10 minutes")

    yield

    # Shutdown
    scheduler.shutdown()
    print(f"[{datetime.now()}] Self-ping scheduler stopped")


# Initialize FastAPI app
app = FastAPI(
    title="Vandreren Travel API",
    version="1.0.0",
    description="AI-powered travel planning with group collaboration features",
    lifespan=lifespan,
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


@app.get("/ping", tags=["Health"])
async def ping():
    """Self-ping endpoint to keep the service alive"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "message": "Service is alive",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
