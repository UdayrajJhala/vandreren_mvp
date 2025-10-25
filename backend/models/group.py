from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .database import Base


class TravelGroup(Base):
    __tablename__ = "travel_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text)
    creator_id = Column(Integer, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    role = Column(String, default="member")  # creator, admin, member
    joined_at = Column(DateTime, default=datetime.utcnow)
