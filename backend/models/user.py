from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    preferences = Column(Text)  # JSON string of user preferences
    created_at = Column(DateTime, default=datetime.utcnow)
