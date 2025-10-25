from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import json

from models.database import get_db
from models.user import User
from models.itinerary import Itinerary
from models.progress import ActivityProgress
from models.group import GroupMember
from models.schemas import ActivityProgressUpdate
from utils.auth import get_current_user

router = APIRouter()


@router.post("/activity/progress")
async def update_activity_progress(
    progress_data: ActivityProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark an activity as completed or update its progress"""
    # Check if itinerary exists and user has access
    itinerary = (
        db.query(Itinerary).filter(Itinerary.id == progress_data.itinerary_id).first()
    )
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Check access (owner or group member)
    has_access = itinerary.user_id == current_user.id
    if itinerary.is_group and itinerary.group_id:
        membership = (
            db.query(GroupMember)
            .filter(
                GroupMember.group_id == itinerary.group_id,
                GroupMember.user_id == current_user.id,
            )
            .first()
        )
        has_access = has_access or membership is not None

    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    # Find or create progress record
    progress = (
        db.query(ActivityProgress)
        .filter(
            ActivityProgress.itinerary_id == progress_data.itinerary_id,
            ActivityProgress.user_id == current_user.id,
            ActivityProgress.day == progress_data.day,
            ActivityProgress.activity_index == progress_data.activity_index,
        )
        .first()
    )

    if progress:
        progress.completed = 1 if progress_data.completed else 0
        progress.notes = progress_data.notes
        progress.completed_at = datetime.utcnow() if progress_data.completed else None
    else:
        progress = ActivityProgress(
            itinerary_id=progress_data.itinerary_id,
            user_id=current_user.id,
            day=progress_data.day,
            activity_index=progress_data.activity_index,
            completed=1 if progress_data.completed else 0,
            notes=progress_data.notes,
            completed_at=datetime.utcnow() if progress_data.completed else None,
        )
        db.add(progress)

    db.commit()

    return {"message": "Progress updated successfully"}


@router.get("/activity/progress/{itinerary_id}")
async def get_activity_progress(
    itinerary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get progress for an itinerary"""
    # Check if itinerary exists and user has access
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Check access
    has_access = itinerary.user_id == current_user.id
    if itinerary.is_group and itinerary.group_id:
        membership = (
            db.query(GroupMember)
            .filter(
                GroupMember.group_id == itinerary.group_id,
                GroupMember.user_id == current_user.id,
            )
            .first()
        )
        has_access = has_access or membership is not None

    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get all progress records for this itinerary
    progress_records = (
        db.query(ActivityProgress)
        .filter(ActivityProgress.itinerary_id == itinerary_id)
        .all()
    )

    # Calculate statistics
    itinerary_data = json.loads(itinerary.itinerary_data)
    itinerary_obj = itinerary_data.get("itinerary", itinerary_data)

    total_activities = sum(
        len(day.get("activities", [])) for day in itinerary_obj.get("days", [])
    )
    completed_activities = sum(1 for p in progress_records if p.completed == 1)
    progress_percentage = (
        (completed_activities / total_activities * 100) if total_activities > 0 else 0
    )

    return {
        "itinerary_id": itinerary_id,
        "total_activities": total_activities,
        "completed_activities": completed_activities,
        "progress_percentage": round(progress_percentage, 2),
        "progress_details": [
            {
                "day": p.day,
                "activity_index": p.activity_index,
                "completed": p.completed == 1,
                "notes": p.notes,
                "completed_at": p.completed_at,
                "user_id": p.user_id,
            }
            for p in progress_records
        ],
    }
