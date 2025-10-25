from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from datetime import datetime
from .database import Base


class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    conversation_id = Column(Integer, index=True)
    title = Column(String)
    destination = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    budget = Column(Float)
    itinerary_data = Column(Text)  # JSON string of the full itinerary
    is_group = Column(Integer, default=0)  # 0 for individual, 1 for group
    group_id = Column(Integer, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
