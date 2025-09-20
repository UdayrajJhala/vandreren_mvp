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

load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


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
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def create_system_prompt(self, user_preferences: dict, trip_context: dict = None):
        base_prompt = """You are Vandreren, an AI travel planning assistant. You help users create personalized travel itineraries.

User Preferences:
- Interests: {interests}
- Travel Style: {travel_style}
- Dietary Restrictions: {dietary_restrictions}
- Budget Preference: {budget_preference}
- Accommodation Type: {accommodation_type}

Guidelines:
1. Always respond in a helpful, friendly tone
2. For itinerary requests, provide structured day-by-day plans
3. Include specific locations, times, and estimated costs
4. Consider weather, local events, and practical logistics
5. Adapt suggestions based on user feedback
The response should be in JSON format only, no additional text. in the message field add the things like "Here is your itinerary" or "Sure, I've updated your itinerary" based on the context.
6. For JSON responses, use this format:
{{
  "message": "string",
  "itinerary": {{
    "destination": "string",
    "duration": "X days",
    "total_estimated_cost": number,
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
            "cost": number,
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

    async def generate_itinerary(
        self, trip_request: TripRequest, user_preferences: dict
    ):
        system_prompt = self.create_system_prompt(user_preferences)

        user_prompt = f"""
Create a detailed travel itinerary for:
- Destination: {trip_request.destination}
- Dates: {trip_request.start_date} to {trip_request.end_date}
- Budget: ${trip_request.budget} (if provided)
- Number of travelers: {trip_request.travelers}
- Special requests: {trip_request.special_requests}

Please provide a structured JSON itinerary following the format specified. Stricly do not return anything other than the JSON object not even any text before or after the JSON. DONT ADD '''json''' or any other text.
"""

        try:
            response = self.model.generate_content(system_prompt + "\n\n" + user_prompt)
            return self.extract_json(response.text)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error generating itinerary: {str(e)}"
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

        try:
            response = self.model.generate_content(full_prompt)
            return self.extract_json(response.text)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error generating response: {str(e)}"
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
    # Get user preferences
    user_preferences = (
        json.loads(current_user.preferences) if current_user.preferences else {}
    )

    # Generate itinerary using Gemini
    itinerary_text = await gemini_agent.generate_itinerary(
        trip_request, user_preferences
    )

    # Create conversation
    conversation = Conversation(
        user_id=current_user.id, title=f"Trip to {trip_request.destination}"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

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

    return {
        "itinerary_id": itinerary.id,
        "conversation_id": conversation.id,
        "itinerary": itinerary_text,
    }


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
    itinerary = (
        db.query(Itinerary)
        .filter(Itinerary.id == itinerary_id, Itinerary.user_id == current_user.id)
        .first()
    )

    if not itinerary:
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
    }


@app.put("/itinerary/{itinerary_id}")
async def update_itinerary(
    itinerary_id: int,
    update_request: ItineraryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    itinerary = (
        db.query(Itinerary)
        .filter(Itinerary.id == itinerary_id, Itinerary.user_id == current_user.id)
        .first()
    )

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Get user preferences
    user_preferences = (
        json.loads(current_user.preferences) if current_user.preferences else {}
    )

    # Create update prompt
    update_prompt = f"""
    Current itinerary: {itinerary.itinerary_data}
    
    User update request: {update_request.update_request}
    
    Please provide an updated itinerary based on this request, maintaining the same JSON format.
    """

    # Generate updated itinerary
    updated_itinerary = await gemini_agent.chat_response(
        update_prompt, [], user_preferences
    )

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
