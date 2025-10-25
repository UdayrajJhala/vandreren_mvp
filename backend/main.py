from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import google.generativeai as genai
import json
import jwt  # Fixed import
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
import httpx
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from geopy.distance import geodesic
import math

load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# Validate API key
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables!")
    print("Please set GEMINI_API_KEY in your .env file")
else:
    print(f"GEMINI_API_KEY loaded: {GEMINI_API_KEY[:10]}...")

# Initialize services
genai.configure(api_key=GEMINI_API_KEY)
# Fixed bcrypt configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./vandreren.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    preferences = Column(Text)  # JSON string of user preferences
    created_at = Column(DateTime, default=datetime.utcnow)


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


class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    conversation_id = Column(Integer, index=True)
    title = Column(String)
    destination = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    budget = Column(Float)
    itinerary_data = Column(Text)  # JSON string of the full itinerary
    is_group = Column(Integer, default=0)  # 0 for individual, 1 for group
    group_id = Column(Integer, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


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


class ActivityProgress(Base):
    __tablename__ = "activity_progress"

    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    day = Column(Integer)
    activity_index = Column(Integer)
    completed = Column(Integer, default=0)  # 0 or 1
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)


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


# Create tables
Base.metadata.create_all(bind=engine)


# Pydantic Models
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: str
    preferences: Optional[Dict[str, Any]] = {}


class UserLogin(BaseModel):
    username: str
    password: str


class UserPreferences(BaseModel):
    interests: Optional[List[str]] = []
    travel_style: Optional[str] = "balanced"  # relaxed, balanced, packed
    dietary_restrictions: Optional[List[str]] = []
    budget_preference: Optional[str] = "mid-range"  # budget, mid-range, luxury
    accommodation_type: Optional[str] = "hotel"  # hotel, hostel, airbnb, resort


class TripRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget: Optional[float] = None
    travelers: Optional[int] = 1
    special_requests: Optional[str] = ""


class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[int] = None


class ItineraryUpdate(BaseModel):
    itinerary_id: int
    update_request: str


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""


class GroupInvite(BaseModel):
    group_id: int
    user_email: str


class ActivityProgressUpdate(BaseModel):
    itinerary_id: int
    day: int
    activity_index: int
    completed: bool
    notes: Optional[str] = ""


# FastAPI app
app = FastAPI(title="Vandreren Travel API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# Gemini Integration Class
class GeminiTravelAgent:
    def __init__(self):
        # Configure with timeout settings
        self.model = genai.GenerativeModel(
            "gemini-2.0-flash-exp",
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
            },
        )

    def create_system_prompt(self, user_preferences: dict, trip_context: dict = None):
        base_prompt = """You are Vandreren, an AI travel planning assistant. You help users create personalized travel itineraries for Indian travelers.

User Preferences:
- Interests: {interests}
- Travel Style: {travel_style}
- Dietary Restrictions: {dietary_restrictions}
- Budget Preference: {budget_preference}
- Accommodation Type: {accommodation_type}

IMPORTANT: All costs and budgets MUST be in Indian Rupees (INR/₹). Never use any other currency.

Guidelines:
1. Always respond in a helpful, friendly tone
2. For itinerary requests, provide structured day-by-day plans
3. Include specific locations, times, and estimated costs in Indian Rupees (₹)
4. Consider weather, local events, and practical logistics
5. Adapt suggestions based on user feedback
The response should be in JSON format only, no additional text. in the message field add the things like "Here is your itinerary" or "Sure, I've updated your itinerary" based on the context.
6. For JSON responses, use this format:
{{
  "message": "string",
  "itinerary": {{
    "destination": "string",
    "duration": "X days",
    "total_estimated_cost": number (in Indian Rupees),
    "currency": "INR",
    "days": [
      {{
        "day": 1,
        "date": "YYYY-MM-DD",
        "theme": "string",
        "activities": [
          {{
            "time": "HH:MM",
            "activity": "string",
            "location": "string",
            "duration": "X hours",
            "cost": number (in Indian Rupees),
            "description": "string",
            "coordinates": {{"lat": number, "lng": number}}
          }}
        ]
      }}
    ]
  }}
}}
""".format(
            interests=user_preferences.get("interests", []),
            travel_style=user_preferences.get("travel_style", "balanced"),
            dietary_restrictions=user_preferences.get("dietary_restrictions", []),
            budget_preference=user_preferences.get("budget_preference", "mid-range"),
            accommodation_type=user_preferences.get("accommodation_type", "hotel"),
        )

        if trip_context:
            base_prompt += f"\n\nCurrent Trip Context: {trip_context}"

        return base_prompt

    def extract_json(self, text):
        """Extract JSON from response text"""
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end != 0:
            return text[start:end]
        return text

    async def validate_query(self, query: str) -> dict:
        """
        Validate if the query is related to travel planning/itinerary creation.
        Returns: {"is_valid": bool, "reason": str}
        """
        validation_prompt = f"""You are a query validator for a travel planning application called Vandreren.

Your task is to determine if the following user query is related to travel planning, itinerary creation, or travel assistance.

Valid queries include:
- Trip planning requests (destinations, dates, activities)
- Itinerary modifications or updates
- Travel recommendations and suggestions
- Questions about destinations, attractions, or travel logistics
- Budget planning for trips
- Accommodation or transportation queries
- Travel tips and advice

Invalid queries include:
- General knowledge questions unrelated to travel
- Math problems or calculations
- Programming or technical questions
- Personal advice unrelated to travel
- Requests to write essays, stories, or code
- Questions about other topics (cooking, health, politics, etc.)

User Query: "{query}"

Respond ONLY with a JSON object in this exact format:
{{"is_valid": true/false, "reason": "brief explanation"}}

If the query is valid (travel-related), set is_valid to true.
If the query is invalid (not travel-related), set is_valid to false and explain briefly why."""

        try:
            response = self.model.generate_content(validation_prompt)
            result_text = response.text.strip()

            # Extract JSON from response
            json_str = self.extract_json(result_text)
            result = json.loads(json_str)

            return {
                "is_valid": result.get("is_valid", False),
                "reason": result.get("reason", "Unknown reason"),
            }
        except Exception as e:
            print(f"Query validation error: {str(e)}")
            # Default to allowing the query if validation fails
            return {
                "is_valid": True,
                "reason": "Validation check failed, defaulting to allow",
            }

    async def generate_itinerary(
        self, trip_request: TripRequest, user_preferences: dict
    ):
        system_prompt = self.create_system_prompt(user_preferences)

        user_prompt = f"""
Create a detailed travel itinerary for:
- Destination: {trip_request.destination}
- Dates: {trip_request.start_date} to {trip_request.end_date}
- Budget: ₹{trip_request.budget} (Indian Rupees) (if provided)
- Number of travelers: {trip_request.travelers}
- Special requests: {trip_request.special_requests}

IMPORTANT: All costs MUST be in Indian Rupees (₹). Provide realistic Indian pricing for activities, food, accommodation, and transportation.

Please provide a structured JSON itinerary following the format specified. Stricly do not return anything other than the JSON object not even any text before or after the JSON. DONT ADD '''json''' or any other text.
"""

        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                print(
                    f"Generating itinerary for {trip_request.destination}... (attempt {attempt + 1}/{max_retries})"
                )

                # Generate content without custom timeout parameter
                response = self.model.generate_content(
                    system_prompt + "\n\n" + user_prompt
                )

                print(f"Response received: {response.text[:200]}...")
                return self.extract_json(response.text)

            except Exception as e:
                error_type = type(e).__name__
                error_msg = str(e)
                print(
                    f"Error in generate_itinerary (attempt {attempt + 1}): {error_type}: {error_msg}"
                )

                if attempt < max_retries - 1:
                    # Check if it's a retryable error
                    if (
                        "timeout" in error_msg.lower()
                        or "deadline" in error_msg.lower()
                        or "503" in error_msg
                        or "504" in error_msg
                    ):
                        print(f"Retrying in {retry_delay} seconds...")
                        import asyncio

                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                        continue

                # If not retryable or last attempt, raise error
                import traceback

                traceback.print_exc()
                raise HTTPException(
                    status_code=500,
                    detail=f"Error generating itinerary after {attempt + 1} attempts: {error_msg}",
                )

    async def chat_response(
        self, message: str, conversation_history: List[Dict], user_preferences: dict
    ):
        system_prompt = self.create_system_prompt(user_preferences)

        # Build conversation context
        context = ""
        for msg in conversation_history[-10:]:  # Last 10 messages for context
            context += f"{msg['role']}: {msg['content']}\n"

        full_prompt = f"{system_prompt}\n\nConversation History:\n{context}\n\nUser: {message}\n\nAssistant:"

        max_retries = 2
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(full_prompt)
                return self.extract_json(response.text)

            except Exception as e:
                error_type = type(e).__name__
                error_msg = str(e)
                print(
                    f"Error in chat_response (attempt {attempt + 1}): {error_type}: {error_msg}"
                )

                if attempt < max_retries - 1:
                    if (
                        "timeout" in error_msg.lower()
                        or "deadline" in error_msg.lower()
                    ):
                        print(f"Retrying in {retry_delay} seconds...")
                        import asyncio

                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                        continue

                raise HTTPException(
                    status_code=500, detail=f"Error generating response: {error_msg}"
                )


# Initialize Gemini agent
gemini_agent = GeminiTravelAgent()

# Geocoding service
geolocator = Nominatim(user_agent="vandreren-travel-app")


def get_coordinates(location: str):
    """Get latitude and longitude for a location"""
    try:
        location_data = geolocator.geocode(location, timeout=10)
        if location_data:
            return {
                "lat": location_data.latitude,
                "lng": location_data.longitude,
                "display_name": location_data.address,
            }
    except (GeocoderTimedOut, GeocoderServiceError):
        pass
    return None


async def search_places_nominatim(query: str, limit: int = 10):
    """Search for places using Nominatim (OpenStreetMap)"""
    try:
        locations = geolocator.geocode(
            query, exactly_one=False, limit=limit, timeout=10
        )
        if locations:
            results = []
            for loc in locations:
                results.append(
                    {
                        "name": loc.address,
                        "lat": loc.latitude,
                        "lng": loc.longitude,
                        "display_name": loc.address,
                        "type": "location",
                    }
                )
            return results
    except (GeocoderTimedOut, GeocoderServiceError):
        pass
    return []


# Route Optimization Functions
def calculate_distance(coord1, coord2):
    """Calculate distance between two coordinates in kilometers using Haversine formula"""
    if not coord1 or not coord2 or not coord1.get("lat") or not coord2.get("lat"):
        return float("inf")
    try:
        return geodesic(
            (coord1["lat"], coord1["lng"]), (coord2["lat"], coord2["lng"])
        ).kilometers
    except:
        return float("inf")


def optimize_route(activities):
    """
    Optimize the order of activities using a nearest neighbor algorithm.
    This reduces total travel distance between locations.
    """
    if not activities or len(activities) <= 2:
        return activities

    # Filter activities with valid coordinates
    activities_with_coords = [
        a
        for a in activities
        if a.get("coordinates")
        and a["coordinates"].get("lat")
        and a["coordinates"].get("lng")
    ]
    activities_without_coords = [
        a for a in activities if a not in activities_with_coords
    ]

    if len(activities_with_coords) <= 2:
        return activities

    # Start with the first activity
    optimized = [activities_with_coords[0]]
    remaining = activities_with_coords[1:]

    # Nearest neighbor algorithm
    while remaining:
        current = optimized[-1]
        nearest_idx = 0
        min_distance = float("inf")

        for idx, activity in enumerate(remaining):
            dist = calculate_distance(current["coordinates"], activity["coordinates"])
            if dist < min_distance:
                min_distance = dist
                nearest_idx = idx

        optimized.append(remaining.pop(nearest_idx))

    # Add back activities without coordinates at the end
    optimized.extend(activities_without_coords)

    return optimized


def calculate_travel_time(distance_km):
    """Estimate travel time based on distance (assuming average 30 km/h in cities)"""
    hours = distance_km / 30
    return hours


def optimize_itinerary_routes(itinerary_data):
    """
    Optimize all days in an itinerary for better routing.
    Returns the optimized itinerary.
    """
    try:
        if isinstance(itinerary_data, str):
            itinerary = json.loads(itinerary_data)
        else:
            itinerary = itinerary_data

        if "itinerary" in itinerary:
            itinerary_obj = itinerary["itinerary"]
        else:
            itinerary_obj = itinerary

        if "days" not in itinerary_obj:
            return itinerary_data

        # Optimize each day's activities
        for day in itinerary_obj["days"]:
            if "activities" in day and len(day["activities"]) > 2:
                # Optimize the route for this day
                day["activities"] = optimize_route(day["activities"])

                # Calculate total distance for the day
                total_distance = 0
                for i in range(len(day["activities"]) - 1):
                    curr_coords = day["activities"][i].get("coordinates")
                    next_coords = day["activities"][i + 1].get("coordinates")
                    if curr_coords and next_coords:
                        distance = calculate_distance(curr_coords, next_coords)
                        total_distance += distance

                day["total_distance_km"] = round(total_distance, 2)
                day["estimated_travel_time_hours"] = round(
                    calculate_travel_time(total_distance), 2
                )

        if "itinerary" in itinerary:
            itinerary["message"] = (
                itinerary.get("message", "")
                + " Routes have been optimized for minimal travel time."
            )
            return itinerary
        else:
            return itinerary_obj

    except Exception as e:
        print(f"Error optimizing routes: {str(e)}")
        return itinerary_data


# Weather service
async def get_weather_info(location: str, date: str = None):
    """Get weather information for a location"""
    try:
        # Using a simple weather API (you can replace with preferred service)
        async with httpx.AsyncClient() as client:
            # This is a placeholder - replace with actual weather API
            response = await client.get(
                f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid=your_weather_api_key"
            )
            if response.status_code == 200:
                return response.json()
    except:
        pass
    return {"description": "Weather information unavailable"}


# API Routes


@app.post("/auth/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = (
        db.query(User)
        .filter((User.email == user.email) | (User.username == user.username))
        .first()
    )
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # Create new user
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        preferences=json.dumps(user.preferences),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create access token
    access_token = create_access_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "full_name": db_user.full_name,
        },
    }


@app.post("/auth/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "full_name": db_user.full_name,
        },
    }


@app.get("/user/preferences")
async def get_user_preferences(current_user: User = Depends(get_current_user)):
    preferences = (
        json.loads(current_user.preferences) if current_user.preferences else {}
    )
    return preferences


@app.put("/user/preferences")
async def update_user_preferences(
    preferences: UserPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.preferences = json.dumps(preferences.dict())
    db.commit()
    return {"message": "Preferences updated successfully"}


@app.post("/itinerary/create")
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

        # Generate itinerary using Gemini
        print("Calling Gemini API...")
        itinerary_text = await gemini_agent.generate_itinerary(
            trip_request, user_preferences
        )
        print(f"Itinerary generated, length: {len(itinerary_text)}")

        # Optimize routes in the itinerary
        try:
            itinerary_json = json.loads(itinerary_text)
            optimized_itinerary = optimize_itinerary_routes(itinerary_json)
            itinerary_text = json.dumps(optimized_itinerary)
            print("Route optimization successful")
        except Exception as e:
            print(f"Route optimization failed: {str(e)}")
            # Continue with non-optimized itinerary

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


@app.post("/chat")
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


@app.get("/itineraries")
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


@app.get("/itinerary/{itinerary_id}")
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


@app.put("/itinerary/{itinerary_id}")
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
        current_itinerary = json.loads(itinerary.itinerary_data)
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
    except:
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
        updated_json = json.loads(updated_itinerary)
        optimized = optimize_itinerary_routes(updated_json)
        updated_itinerary = json.dumps(optimized)
    except Exception as e:
        print(f"Route optimization failed: {str(e)}")

    # Update itinerary
    itinerary.itinerary_data = updated_itinerary
    itinerary.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Itinerary updated successfully", "itinerary": updated_itinerary}


@app.get("/conversations")
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


@app.get("/conversation/{conversation_id}/messages")
async def get_conversation_messages(
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


@app.get("/places/search")
async def search_places(query: str, limit: int = 10):
    """Search for places using Nominatim (OpenStreetMap)"""
    try:
        results = await search_places_nominatim(query, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching places: {str(e)}")


@app.get("/geocode/{location}")
async def geocode_location(location: str):
    """Get coordinates for a specific location"""
    coordinates = get_coordinates(location)
    if coordinates:
        return coordinates
    else:
        raise HTTPException(status_code=404, detail="Location not found")


@app.get("/weather/{location}")
async def get_weather(location: str):
    """Get weather information for a location"""
    weather_info = await get_weather_info(location)
    return weather_info


# Group Travel Endpoints
@app.post("/groups")
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


@app.get("/groups")
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


@app.get("/groups/{group_id}")
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


@app.post("/groups/{group_id}/invite")
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


@app.post("/groups/{group_id}/itinerary")
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


@app.post("/groups/{group_id}/add-itinerary/{itinerary_id}")
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


# Activity Progress Tracking
@app.post("/activity/progress")
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


@app.get("/activity/progress/{itinerary_id}")
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


# Notification Endpoints
@app.get("/notifications")
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


@app.get("/notifications/unread-count")
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


@app.post("/notifications/{notification_id}/read")
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


@app.post("/notifications/{notification_id}/accept")
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


@app.post("/notifications/{notification_id}/reject")
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


@app.get("/")
async def root():
    return {
        "message": "Welcome to Vandreren Travel API",
        "version": "1.0.0",
        "status": "active",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
