from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from models.database import get_db
from models.user import User
from models.notification import Notification
from models.group import TravelGroup, GroupMember
from utils.auth import get_current_user

router = APIRouter()


@router.get("")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all notifications for current user"""
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    result = []
    for notification in notifications:
        notif_dict = {
            "id": notification.id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "status": notification.status,
            "created_at": notification.created_at.isoformat(),
            "read_at": (
                notification.read_at.isoformat() if notification.read_at else None
            ),
        }

        # Add additional info based on type
        if notification.type == "group_invite":
            notif_dict["group_id"] = notification.related_id
            # Get group details
            group = (
                db.query(TravelGroup)
                .filter(TravelGroup.id == notification.related_id)
                .first()
            )
            if group:
                notif_dict["group_name"] = group.name
            # Get inviter details
            if notification.inviter_id:
                inviter = (
                    db.query(User).filter(User.id == notification.inviter_id).first()
                )
                if inviter:
                    notif_dict["inviter_name"] = inviter.full_name

        result.append(notif_dict)

    return result


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get count of unread notifications"""
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.read_at == None)
        .count()
    )
    return {"count": count}


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read"""
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id, Notification.user_id == current_user.id
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read_at = datetime.utcnow()
    db.commit()

    return {"message": "Notification marked as read"}


@router.post("/{notification_id}/accept")
async def accept_group_invite(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept a group invitation"""
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
            Notification.type == "group_invite",
            Notification.status == "pending",
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404, detail="Invitation not found or already processed"
        )

    # Check if user is already a member
    existing = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id == notification.related_id,
            GroupMember.user_id == current_user.id,
        )
        .first()
    )

    if existing:
        notification.status = "accepted"
        db.commit()
        raise HTTPException(
            status_code=400, detail="You are already a member of this group"
        )

    # Add user to group
    new_member = GroupMember(
        group_id=notification.related_id, user_id=current_user.id, role="member"
    )
    db.add(new_member)

    # Update notification status
    notification.status = "accepted"
    notification.read_at = datetime.utcnow()
    db.commit()

    return {"message": "Group invitation accepted", "group_id": notification.related_id}


@router.post("/{notification_id}/reject")
async def reject_group_invite(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a group invitation"""
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
            Notification.type == "group_invite",
            Notification.status == "pending",
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404, detail="Invitation not found or already processed"
        )

    # Update notification status
    notification.status = "rejected"
    notification.read_at = datetime.utcnow()
    db.commit()

    return {"message": "Group invitation rejected"}
