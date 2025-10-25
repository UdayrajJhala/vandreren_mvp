from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, index=True)
    content = Column(Text)
    role = Column(String)  # "user" or "assistant"
    created_at = Column(DateTime, default=datetime.utcnow)
