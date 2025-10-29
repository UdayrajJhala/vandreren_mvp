from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import json
import re
import string
import time
from models.database import get_db
from models.user import User
from models.itinerary import Itinerary
from models.conversation import Conversation, Message
from models.group import GroupMember
from models.schemas import TripRequest, ItineraryUpdate
from utils.auth import get_current_user

# Route optimizer import kept for potential future use
# from utils.route_optimizer import optimize_itinerary_routes
from services.gemini_service import gemini_agent

router = APIRouter()


def clean_json_string(json_str):
    """Clean and fix common JSON formatting issues from LLM responses"""
    import re

    # Remove any markdown code block markers
    json_str = re.sub(r"^```json\s*", "", json_str)
    json_str = re.sub(r"\s*```$", "", json_str)

    # Fix malformed coordinates patterns like: {"lat": X, " "lng": Y}
    # Match patterns where there's a space and extra quote before "lng" or other keys
    json_str = re.sub(r',\s*"\s+"([a-zA-Z_]+)":', r', "\1":', json_str)

    # Fix patterns like: {"lat": X," "lng": Y} (no space after comma)
    json_str = re.sub(r'," "([a-zA-Z_]+)":', r', "\1":', json_str)

    # Fix trailing commas before closing braces/brackets
    json_str = re.sub(r",(\s*[}\]])", r"\1", json_str)

    # Remove any BOM or invisible characters
    json_str = json_str.strip("\ufeff\x00")

    return json_str


def safe_json_dumps(data):
    """Safely convert data to JSON string with proper error handling"""
    try:
        if isinstance(data, str):
            # Clean the string first
            cleaned = clean_json_string(data)
            # Validate it's valid JSON
            json.loads(cleaned)
            return cleaned
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
        # Clean the JSON string before parsing
        cleaned_data = clean_json_string(data)
        return json.loads(cleaned_data)
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

        # Create a safe filename from destination and timestamp
        safe_chars = string.ascii_letters + string.digits + " _-"
        safe_destination = "".join(
            c if c in safe_chars else "_" for c in trip_request.destination
        )
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = f"{safe_destination}_{timestamp}"

        with open(
            f"similarity_search_output_{safe_name}.txt", "w", encoding="utf-8"
        ) as f:
            f.write(itinerary_text)

        print(f"Itinerary generated, length: {len(itinerary_text)}")

        # Clean and validate JSON first
        try:
            print("Cleaning and validating JSON response...")
            itinerary_text = clean_json_string(itinerary_text)
            test_parse = json.loads(itinerary_text)
            print("✓ Initial JSON validation passed")
        except json.JSONDecodeError as e:
            print(f"✗ Initial JSON validation failed: {e}")
            print(f"Error at position {e.pos}: {e.msg}")
            print(f"Context: ...{itinerary_text[max(0, e.pos-100):e.pos+100]}...")
            raise HTTPException(
                status_code=500,
                detail=f"Generated itinerary has invalid JSON format at position {e.pos}: {e.msg}",
            )

        # Route optimization disabled - Gemini generates optimal routes directly
        # Ensure we have valid JSON
        try:
            itinerary_text = safe_json_dumps(itinerary_text)
            print("✓ Route optimization successful")
        except Exception as fallback_error:
            print(f"✗ Failed to process itinerary: {fallback_error}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process itinerary data: {str(fallback_error)}",
            )

        # Final validation before saving
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

    # Route optimization disabled - Gemini generates optimal routes directly
    # Ensure we still have valid JSON
    try:
        updated_itinerary = safe_json_dumps(updated_itinerary)
        print("✓ Route optimization successful")
    except Exception as e:
        print(f"Failed to process updated itinerary: {str(e)}")
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
