from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json

from models.database import get_db
from models.user import User
from models.group import TravelGroup, GroupMember
from models.itinerary import Itinerary
from models.conversation import Conversation
from models.notification import Notification
from models.schemas import GroupCreate, GroupInvite, TripRequest
from utils.auth import get_current_user
from utils.route_optimizer import optimize_itinerary_routes
from services.gemini_service import gemini_agent

router = APIRouter()


@router.post("")
async def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new travel group"""
    group = TravelGroup(
        name=group_data.name,
        description=group_data.description,
        creator_id=current_user.id,
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    # Add creator as admin member
    member = GroupMember(group_id=group.id, user_id=current_user.id, role="creator")
    db.add(member)
    db.commit()

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "created_at": group.created_at,
    }


@router.get("")
async def get_user_groups(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all groups for current user"""
    memberships = (
        db.query(GroupMember).filter(GroupMember.user_id == current_user.id).all()
    )
    group_ids = [m.group_id for m in memberships]

    groups = db.query(TravelGroup).filter(TravelGroup.id.in_(group_ids)).all()

    result = []
    for group in groups:
        members_count = (
            db.query(GroupMember).filter(GroupMember.group_id == group.id).count()
        )
        user_role = next(
            (m.role for m in memberships if m.group_id == group.id), "member"
        )

        result.append(
            {
                "id": group.id,
                "name": group.name,
                "description": group.description,
                "creator_id": group.creator_id,
                "members_count": members_count,
                "user_role": user_role,
                "created_at": group.created_at,
            }
        )

    return result


@router.get("/{group_id}")
async def get_group_details(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get group details and members"""
    # Check if user is a member
    membership = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id == group_id, GroupMember.user_id == current_user.id
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    group = db.query(TravelGroup).filter(TravelGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Get all members
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
    member_details = []

    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        if user:
            member_details.append(
                {
                    "user_id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "role": member.role,
                    "joined_at": member.joined_at,
                }
            )

    # Get group itineraries
    itineraries = (
        db.query(Itinerary)
        .filter(Itinerary.group_id == group_id)
        .order_by(Itinerary.created_at.desc())
        .all()
    )

    itinerary_list = [
        {
            "id": it.id,
            "title": it.title,
            "destination": it.destination,
            "start_date": it.start_date,
            "end_date": it.end_date,
            "budget": it.budget,
        }
        for it in itineraries
    ]

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "creator_id": group.creator_id,
        "members": member_details,
        "itineraries": itinerary_list,
        "user_role": membership.role,
    }


@router.post("/{group_id}/invite")
async def invite_to_group(
    group_id: int,
    invite_data: GroupInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invite a user to a group"""
    # Check if current user is admin or creator
    membership = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
        )
        .first()
    )

    if not membership or membership.role not in ["creator", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to invite members")

    # Find user by email
    invited_user = db.query(User).filter(User.email == invite_data.user_email).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already a member
    existing = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id == group_id, GroupMember.user_id == invited_user.id
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    # Check if there's already a pending invitation
    existing_notification = (
        db.query(Notification)
        .filter(
            Notification.user_id == invited_user.id,
            Notification.type == "group_invite",
            Notification.related_id == group_id,
            Notification.status == "pending",
        )
        .first()
    )

    if existing_notification:
        raise HTTPException(status_code=400, detail="User already has a pending invite")

    # Get group details for the notification
    group = db.query(TravelGroup).filter(TravelGroup.id == group_id).first()

    # Create notification instead of directly adding member
    notification = Notification(
        user_id=invited_user.id,
        type="group_invite",
        title=f"Group Invitation",
        message=f"{current_user.full_name} invited you to join '{group.name}'",
        related_id=group_id,
        inviter_id=current_user.id,
        status="pending",
    )
    db.add(notification)
    db.commit()

    return {"message": "Invitation sent successfully"}


@router.post("/{group_id}/itinerary")
async def create_group_itinerary(
    group_id: int,
    trip_request: TripRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an itinerary for a group"""
    # Check if user is a member
    membership = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id == group_id, GroupMember.user_id == current_user.id
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    # Validate the preferences/destination query
    validation_query = f"Plan a trip to {trip_request.destination}"
    if trip_request.preferences:
        validation_query += f" with preferences: {trip_request.preferences}"

    validation_result = await gemini_agent.validate_query(validation_query)

    if not validation_result["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid travel request. {validation_result['reason']} Please provide a valid travel destination and requirements.",
        )

    # Get user preferences
    user_preferences = (
        json.loads(current_user.preferences) if current_user.preferences else {}
    )

    # Generate itinerary
    itinerary_text = await gemini_agent.generate_itinerary(
        trip_request, user_preferences
    )

    # Optimize routes
    try:
        itinerary_json = json.loads(itinerary_text)
        optimized_itinerary = optimize_itinerary_routes(itinerary_json)
        itinerary_text = json.dumps(optimized_itinerary)
    except Exception as e:
        print(f"Route optimization failed: {str(e)}")

    # Create conversation
    conversation = Conversation(
        user_id=current_user.id, title=f"Group Trip to {trip_request.destination}"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    # Save itinerary
    itinerary = Itinerary(
        user_id=current_user.id,
        conversation_id=conversation.id,
        title=f"Group Trip to {trip_request.destination}",
        destination=trip_request.destination,
        start_date=trip_request.start_date,
        end_date=trip_request.end_date,
        budget=trip_request.budget,
        itinerary_data=itinerary_text,
        is_group=1,
        group_id=group_id,
    )
    db.add(itinerary)
    db.commit()
    db.refresh(itinerary)

    return {
        "itinerary_id": itinerary.id,
        "conversation_id": conversation.id,
        "itinerary": itinerary_text,
    }


@router.post("/{group_id}/add-itinerary/{itinerary_id}")
async def add_itinerary_to_group(
    group_id: int,
    itinerary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add an existing itinerary to a group"""
    # Check if user is a member of the group
    membership = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id == group_id, GroupMember.user_id == current_user.id
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    # Check if itinerary exists and belongs to user
    itinerary = (
        db.query(Itinerary)
        .filter(Itinerary.id == itinerary_id, Itinerary.user_id == current_user.id)
        .first()
    )

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Update itinerary to be part of the group
    itinerary.is_group = 1
    itinerary.group_id = group_id

    db.commit()
    db.refresh(itinerary)

    return {
        "message": "Itinerary added to group successfully",
        "itinerary_id": itinerary.id,
        "group_id": group_id,
    }
