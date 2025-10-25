from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import json

from models.database import get_db
from models.user import User
from models.conversation import Conversation, Message
from models.schemas import ChatMessage
from utils.auth import get_current_user
from services.gemini_service import gemini_agent

router = APIRouter()


@router.post("/chat")
async def chat(
    chat_request: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get or create conversation
    if chat_request.conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == chat_request.conversation_id,
                Conversation.user_id == current_user.id,
            )
            .first()
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=current_user.id, title="Travel Chat")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Get conversation history
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
        .all()
    )

    conversation_history = [
        {"role": msg.role, "content": msg.content} for msg in messages
    ]

    # Get user preferences
    user_preferences = (
        json.loads(current_user.preferences) if current_user.preferences else {}
    )

    # Validate the query first
    validation_result = await gemini_agent.validate_query(chat_request.message)

    if not validation_result["is_valid"]:
        # Return a polite rejection message
        rejection_message = f"I apologize, but I can only assist with travel planning and itinerary-related queries. Your question appears to be about something else. {validation_result['reason']}\n\nPlease ask me about:\n- Planning trips and itineraries\n- Travel destinations and attractions\n- Budget planning for trips\n- Travel recommendations\n- Modifying existing itineraries\n\nHow can I help you plan your next adventure?"

        # Save messages even for rejected queries to maintain conversation history
        user_message = Message(
            conversation_id=conversation.id, content=chat_request.message, role="user"
        )
        db.add(user_message)

        assistant_message = Message(
            conversation_id=conversation.id, content=rejection_message, role="assistant"
        )
        db.add(assistant_message)

        conversation.updated_at = datetime.utcnow()
        db.commit()

        return {
            "conversation_id": conversation.id,
            "response": rejection_message,
            "query_rejected": True,
        }

    # Generate response
    response = await gemini_agent.chat_response(
        chat_request.message, conversation_history, user_preferences
    )

    # Save messages
    user_message = Message(
        conversation_id=conversation.id, content=chat_request.message, role="user"
    )
    db.add(user_message)

    assistant_message = Message(
        conversation_id=conversation.id, content=response, role="assistant"
    )
    db.add(assistant_message)

    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()

    db.commit()

    return {"conversation_id": conversation.id, "response": response}


@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    return [
        {
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
        }
        for conv in conversations
    ]


@router.get("/conversation/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id, Conversation.user_id == current_user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )

    return [
        {
            "id": msg.id,
            "content": msg.content,
            "role": msg.role,
            "created_at": msg.created_at,
        }
        for msg in messages
    ]
