import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vandreren.db")

# Fix for Render/Neon PostgreSQL URLs (they use postgres:// but SQLAlchemy needs postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# Validate API key
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables!")
    print("Please set GEMINI_API_KEY in your .env file")
else:
    print(f"GEMINI_API_KEY loaded: {GEMINI_API_KEY[:10]}...")

# Database info
if "postgresql" in DATABASE_URL:
    print("Using PostgreSQL database")
else:
    print("Using SQLite database (local development)")
