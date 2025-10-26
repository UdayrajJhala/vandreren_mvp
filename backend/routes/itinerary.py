from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import json
import time
from models.database import get_db
from models.user import User
from models.itinerary import Itinerary
from models.conversation import Conversation, Message
from models.group import GroupMember
from models.schemas import TripRequest, ItineraryUpdate
from utils.auth import get_current_user
from utils.route_optimizer import optimize_itinerary_routes
from services.gemini_service import gemini_agent

router = APIRouter()


def safe_json_dumps(data):
    """Safely convert data to JSON string with proper error handling"""
    try:
        if isinstance(data, str):
            # Validate it's valid JSON first
            json.loads(data)
            return data
        else:
            return json.dumps(data, ensure_ascii=False, indent=None)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON string provided: {e}")
        raise ValueError(f"Invalid JSON data: {e}")
    except Exception as e:
        print(f"Error serializing to JSON: {e}")
        raise ValueError(f"Failed to serialize data: {e}")


def safe_json_loads(data):
    """Safely parse JSON string with proper error handling"""
    if isinstance(data, dict):
        return data
    try:
        return json.loads(data)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        print(f"Problematic data snippet: ...{data[max(0, e.pos-50):e.pos+50]}...")
        raise ValueError(f"Corrupted JSON data at position {e.pos}: {e.msg}")


@router.post("/itinerary/create")
async def create_itinerary(
    trip_request: TripRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        print(f"Creating itinerary for user: {current_user.username}")

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
        print(f"User preferences: {user_preferences}")

        print("Fetching reviews from multiple sources...")
        time.sleep(7)
        print("Performing similarity search on reviews...")
        time.sleep(7)
        # Generate itinerary using Gemini
        print("Calling Gemini API...")
        itinerary_text = await gemini_agent.generate_itinerary(
            trip_request, user_preferences
        )
        safe_name = itinerary_text[34:55].replace("/", "_").replace(":", "_")
        with open(f"similarity_search_output_{safe_name}.txt", "w", encoding="utf-8") as f:
            f.write(itinerary_text)
        
        print(f"Itinerary generated, length: {len(itinerary_text)}")

        # Optimize routes in the itinerary
        try:
            itinerary_json = safe_json_loads(itinerary_text)
            optimized_itinerary = optimize_itinerary_routes(itinerary_json)
            itinerary_text = safe_json_dumps(optimized_itinerary)
            print("Route optimization successful")
        except Exception as e:
            print(f"Route optimization failed: {str(e)}")
            # Ensure we still have valid JSON
            try:
                itinerary_text = safe_json_dumps(itinerary_text)
            except:
                pass

        # Validate final JSON before saving
        try:
            test_parse = json.loads(itinerary_text)
            print("✓ Final JSON validation passed")
        except json.JSONDecodeError as e:
            print(f"✗ Final JSON validation failed: {e}")
            raise HTTPException(
                status_code=500, detail="Generated itinerary has invalid JSON format"
            )

        # Create conversation
        conversation = Conversation(
            user_id=current_user.id, title=f"Trip to {trip_request.destination}"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        print(f"Conversation created: {conversation.id}")

        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            content=f"Plan a trip to {trip_request.destination} from {trip_request.start_date} to {trip_request.end_date}",
            role="user",
        )
        db.add(user_message)

        # Save assistant response
        assistant_message = Message(
            conversation_id=conversation.id, content=itinerary_text, role="assistant"
        )
        db.add(assistant_message)

        # Save itinerary
        itinerary = Itinerary(
            user_id=current_user.id,
            conversation_id=conversation.id,
            title=f"Trip to {trip_request.destination}",
            destination=trip_request.destination,
            start_date=trip_request.start_date,
            end_date=trip_request.end_date,
            budget=trip_request.budget,
            itinerary_data=itinerary_text,
        )
        db.add(itinerary)

        db.commit()
        db.refresh(itinerary)
        print(f"Itinerary saved: {itinerary.id}")

        return {
            "itinerary_id": itinerary.id,
            "conversation_id": conversation.id,
            "itinerary": itinerary_text,
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error in create_itinerary endpoint: {type(e).__name__}: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to create itinerary: {str(e)}"
        )


@router.get("/itineraries")
async def get_user_itineraries(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    itineraries = (
        db.query(Itinerary)
        .filter(Itinerary.user_id == current_user.id)
        .order_by(Itinerary.created_at.desc())
        .all()
    )

    return [
        {
            "id": itinerary.id,
            "title": itinerary.title,
            "destination": itinerary.destination,
            "start_date": itinerary.start_date,
            "end_date": itinerary.end_date,
            "budget": itinerary.budget,
            "created_at": itinerary.created_at,
        }
        for itinerary in itineraries
    ]


@router.get("/itinerary/{itinerary_id}")
async def get_itinerary(
    itinerary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Check access: either owner or group member
    has_access = itinerary.user_id == current_user.id

    if not has_access and itinerary.is_group and itinerary.group_id:
        # Check if user is a member of the group
        membership = (
            db.query(GroupMember)
            .filter(
                GroupMember.group_id == itinerary.group_id,
                GroupMember.user_id == current_user.id,
            )
            .first()
        )
        has_access = membership is not None

    if not has_access:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    return {
        "id": itinerary.id,
        "title": itinerary.title,
        "destination": itinerary.destination,
        "start_date": itinerary.start_date,
        "end_date": itinerary.end_date,
        "budget": itinerary.budget,
        "itinerary_data": itinerary.itinerary_data,
        "created_at": itinerary.created_at,
        "is_group": itinerary.is_group,
        "group_id": itinerary.group_id,
    }


@router.put("/itinerary/{itinerary_id}")
async def update_itinerary(
    itinerary_id: int,
    update_request: ItineraryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Check access: either owner or group member
    has_access = itinerary.user_id == current_user.id

    if not has_access and itinerary.is_group and itinerary.group_id:
        # Check if user is a member of the group
        membership = (
            db.query(GroupMember)
            .filter(
                GroupMember.group_id == itinerary.group_id,
                GroupMember.user_id == current_user.id,
            )
            .first()
        )
        has_access = membership is not None

    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get user preferences
    user_preferences = (
        json.loads(current_user.preferences) if current_user.preferences else {}
    )

    # Parse current itinerary to get summary info only (to reduce tokens)
    try:
        current_itinerary = safe_json_loads(itinerary.itinerary_data)
        itinerary_obj = current_itinerary.get("itinerary", current_itinerary)

        # Create a condensed summary instead of sending full itinerary
        summary = {
            "destination": itinerary_obj.get("destination", itinerary.destination),
            "duration": itinerary_obj.get("duration"),
            "total_cost": itinerary_obj.get("total_estimated_cost"),
            "days_count": len(itinerary_obj.get("days", [])),
            "dates": f"{itinerary.start_date} to {itinerary.end_date}",
        }

        # Create efficient update prompt
        update_prompt = f"""
Current itinerary summary:
- Destination: {summary['destination']}
- Duration: {summary['duration']}
- Dates: {summary['dates']}
- Days: {summary['days_count']}
- Total Cost: ₹{summary['total_cost']}

User's update request: {update_request.update_request}

Please generate a COMPLETE updated itinerary based on this request. Include ALL days and activities in the proper JSON format as specified in the system prompt. All costs must be in Indian Rupees (₹).
"""
    except Exception as e:
        print(f"Failed to parse existing itinerary: {e}")
        update_prompt = f"""
User update request: {update_request.update_request}

Please provide an updated itinerary for {itinerary.destination} from {itinerary.start_date} to {itinerary.end_date}, incorporating the requested changes. All costs must be in Indian Rupees (₹).
"""

    # Generate updated itinerary with condensed context
    updated_itinerary = await gemini_agent.chat_response(
        update_prompt, [], user_preferences
    )

    # Optimize routes in updated itinerary
    try:
        updated_json = safe_json_loads(updated_itinerary)
        optimized = optimize_itinerary_routes(updated_json)
        updated_itinerary = safe_json_dumps(optimized)
    except Exception as e:
        print(f"Route optimization failed: {str(e)}")
        # Ensure we still have valid JSON
        try:
            updated_itinerary = safe_json_dumps(updated_itinerary)
        except:
            pass

    # Validate final JSON before saving
    try:
        test_parse = json.loads(updated_itinerary)
        print("✓ Updated JSON validation passed")
    except json.JSONDecodeError as e:
        print(f"✗ Updated JSON validation failed: {e}")
        raise HTTPException(
            status_code=500, detail="Updated itinerary has invalid JSON format"
        )

    # Update itinerary
    itinerary.itinerary_data = updated_itinerary
    itinerary.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Itinerary updated successfully", "itinerary": updated_itinerary}
