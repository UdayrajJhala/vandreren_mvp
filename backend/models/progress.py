from sqlalchemy import Column, Integer, DateTime, Text
from datetime import datetime
from .database import Base


class ActivityProgress(Base):
    __tablename__ = "activity_progress"

    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    day = Column(Integer)
    activity_index = Column(Integer)
    completed = Column(Integer, default=0)  # 0 or 1
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
