from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import json

from models.database import get_db
from models.user import User
from models.schemas import UserCreate, UserLogin, UserPreferences
from utils.auth import (
    create_access_token,
    get_current_user,
    verify_password,
    hash_password,
)

router = APIRouter()


@router.post("/auth/register")
@router.post("/register")  # Alternative path
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username exists
    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create new user
    hashed_password = hash_password(user.password)
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        preferences=json.dumps(user.preferences),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate token
    token = create_access_token({"user_id": new_user.id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username,
            "full_name": new_user.full_name,
        },
    }


@router.post("/auth/login")
@router.post("/login")  # Alternative path
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token({"user_id": db_user.id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "username": db_user.username,
            "full_name": db_user.full_name,
        },
    }


@router.get("/auth/me")
@router.get("/me")  # Alternative path
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "preferences": (
            json.loads(current_user.preferences) if current_user.preferences else {}
        ),
    }


@router.put("/preferences")
@router.put("/user/preferences")  # Backward compatibility with old frontend
async def update_preferences(
    preferences: UserPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.preferences = json.dumps(preferences.dict())
    db.commit()
    return {"message": "Preferences updated successfully"}


@router.get("/user/preferences")  # Backward compatibility with old frontend
async def get_preferences(
    current_user: User = Depends(get_current_user),
):
    return json.loads(current_user.preferences) if current_user.preferences else {}
