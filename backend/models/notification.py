from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    type = Column(String)  # "group_invite", etc.
    title = Column(String)
    message = Column(Text)
    related_id = Column(Integer, nullable=True)  # group_id for invites
    inviter_id = Column(Integer, nullable=True)  # who sent the invite
    status = Column(String, default="pending")  # pending, accepted, rejected, read
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)
