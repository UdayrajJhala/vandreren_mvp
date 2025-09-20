# Vandreren Travel API Guide

## Base URL
```
http://localhost:8000
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Endpoints

### Authentication Endpoints

#### 1. Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "full_name": "John Doe",
  "preferences": {
    "interests": ["museums", "food", "nature"],
    "travel_style": "balanced",
    "dietary_restrictions": ["vegetarian"],
    "budget_preference": "mid-range",
    "accommodation_type": "hotel"
  }
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "johndoe",
    "full_name": "John Doe"
  }
}
```

#### 2. Login
**POST** `/auth/login`

Login with existing credentials.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:** Same as register response.

---

### User Preferences

#### 3. Get User Preferences
**GET** `/user/preferences`
*Requires Authentication*

Get current user's preferences.

**Response:**
```json
{
  "interests": ["museums", "food", "nature"],
  "travel_style": "balanced",
  "dietary_restrictions": ["vegetarian"],
  "budget_preference": "mid-range",
  "accommodation_type": "hotel"
}
```

#### 4. Update User Preferences
**PUT** `/user/preferences`
*Requires Authentication*

Update user preferences.

**Request Body:**
```json
{
  "interests": ["art", "history", "beaches"],
  "travel_style": "relaxed",
  "dietary_restrictions": [],
  "budget_preference": "luxury",
  "accommodation_type": "resort"
}
```

**Response:**
```json
{
  "message": "Preferences updated successfully"
}
```

**Preference Options:**
- `travel_style`: "relaxed", "balanced", "packed"
- `budget_preference`: "budget", "mid-range", "luxury"
- `accommodation_type`: "hotel", "hostel", "airbnb", "resort"

---

### Itinerary Management

#### 5. Create New Itinerary
**POST** `/itinerary/create`
*Requires Authentication*

Generate a new travel itinerary using AI.

**Request Body:**
```json
{
  "destination": "Paris, France",
  "start_date": "2024-06-15",
  "end_date": "2024-06-20",
  "budget": 2000.0,
  "travelers": 2,
  "special_requests": "Include romantic restaurants and avoid crowded tourist spots"
}
```

**Response:**
```json
{
  "itinerary_id": 123,
  "conversation_id": 45,
  "itinerary": "Generated itinerary text/JSON from Gemini..."
}
```

#### 6. Get User's Itineraries
**GET** `/itineraries`
*Requires Authentication*

Get all saved itineraries for the current user.

**Response:**
```json
[
  {
    "id": 123,
    "title": "Trip to Paris, France",
    "destination": "Paris, France",
    "start_date": "2024-06-15",
    "end_date": "2024-06-20",
    "budget": 2000.0,
    "created_at": "2024-01-15T10:30:00"
  }
]
```

#### 7. Get Specific Itinerary
**GET** `/itinerary/{itinerary_id}`
*Requires Authentication*

Get detailed information about a specific itinerary.

**Response:**
```json
{
  "id": 123,
  "title": "Trip to Paris, France",
  "destination": "Paris, France",
  "start_date": "2024-06-15",
  "end_date": "2024-06-20",
  "budget": 2000.0,
  "itinerary_data": "Full itinerary JSON/text...",
  "created_at": "2024-01-15T10:30:00"
}
```

#### 8. Update Itinerary
**PUT** `/itinerary/{itinerary_id}`
*Requires Authentication*

Modify an existing itinerary using natural language.

**Request Body:**
```json
{
  "itinerary_id": 123,
  "update_request": "Add more museums to day 2 and remove the shopping activity"
}
```

**Response:**
```json
{
  "message": "Itinerary updated successfully",
  "itinerary": "Updated itinerary text/JSON..."
}
```

---

### Chat Interface

#### 9. Chat with AI
**POST** `/chat`
*Requires Authentication*

Have a conversation with the AI for trip planning.

**Request Body:**
```json
{
  "message": "I want to plan a weekend trip to Tokyo. I love anime and ramen!",
  "conversation_id": 45
}
```

Note: If `conversation_id` is null, a new conversation will be created.

**Response:**
```json
{
  "conversation_id": 45,
  "response": "AI response about Tokyo trip planning..."
}
```

#### 10. Get Conversations
**GET** `/conversations`
*Requires Authentication*

Get all conversations for the current user.

**Response:**
```json
[
  {
    "id": 45,
    "title": "Travel Chat",
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T11:45:00"
  }
]
```

#### 11. Get Conversation Messages
**GET** `/conversation/{conversation_id}/messages`
*Requires Authentication*

Get all messages in a specific conversation.

**Response:**
```json
[
  {
    "id": 1,
    "content": "I want to plan a trip to Tokyo",
    "role": "user",
    "created_at": "2024-01-15T10:30:00"
  },
  {
    "id": 2,
    "content": "I'd be happy to help you plan your Tokyo trip...",
    "role": "assistant",
    "created_at": "2024-01-15T10:31:00"
  }
]
```

---

### Location Services

#### 12. Search Places
**GET** `/places/search?query={location}&limit={number}`

Search for places using OpenStreetMap data.

**Parameters:**
- `query`: Location to search for (e.g., "restaurants in Paris")
- `limit`: Maximum number of results (optional, default: 10)

**Example:**
```
GET /places/search?query=museums in London&limit=5
```

**Response:**
```json
{
  "results": [
    {
      "name": "British Museum, Great Russell Street, London, UK",
      "lat": 51.5194,
      "lng": -0.1270,
      "display_name": "British Museum, Great Russell Street, London, UK",
      "type": "location"
    }
  ]
}
```

#### 13. Geocode Location
**GET** `/geocode/{location}`

Get coordinates for a specific location.

**Example:**
```
GET /geocode/Eiffel Tower, Paris
```

**Response:**
```json
{
  "lat": 48.8584,
  "lng": 2.2945,
  "display_name": "Tour Eiffel, Avenue Anatole France, Paris, France"
}
```

#### 14. Get Weather
**GET** `/weather/{location}`

Get weather information for a location.

**Response:**
```json
{
  "description": "Weather information unavailable"
}
```

Note: Weather endpoint is a placeholder. You'll need to integrate with a weather API service.

---

## Error Responses

### Common Error Formats

**401 Unauthorized:**
```json
{
  "detail": "Invalid token"
}
```

**404 Not Found:**
```json
{
  "detail": "Itinerary not found"
}
```

**422 Validation Error:**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Error generating itinerary: API key invalid"
}
```

---

## Usage Flow Examples

### 1. Complete User Registration and First Itinerary

```javascript
// 1. Register user
const registerResponse = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "john@example.com",
    username: "john_traveler",
    password: "securepass123",
    full_name: "John Smith",
    preferences: {
      interests: ["history", "food"],
      travel_style: "balanced",
      budget_preference: "mid-range"
    }
  })
});

const { access_token } = await registerResponse.json();

// 2. Create itinerary
const itineraryResponse = await fetch('/itinerary/create', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    destination: "Rome, Italy",
    start_date: "2024-07-01",
    end_date: "2024-07-05",
    budget: 1500,
    travelers: 2,
    special_requests: "Include Colosseum and Vatican"
  })
});
```

### 2. Chat-based Itinerary Modification

```javascript
// Start a chat conversation
const chatResponse = await fetch('/chat', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    message: "Can you modify my Rome itinerary to include more food experiences and less museums?",
    conversation_id: null // Creates new conversation
  })
});

const { conversation_id } = await chatResponse.json();

// Continue the conversation
const followUpResponse = await fetch('/chat', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    message: "Also add a cooking class if possible",
    conversation_id: conversation_id
  })
});
```

---

## Rate Limits and Best Practices

### Rate Limits
- No explicit rate limits currently implemented
- Gemini API has its own rate limits

### Best Practices
1. **Store JWT tokens securely** - Use secure storage on frontend
2. **Handle token expiration** - Tokens expire after 7 days
3. **Validate inputs** - Check date formats, required fields
4. **Handle errors gracefully** - Show user-friendly messages
5. **Cache location data** - Avoid repeated geocoding calls
6. **Provide loading states** - AI responses can take 5-30 seconds

### Environment Setup
Create a `.env` file with:
```
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_for_jwt_here
```

### Development vs Production
- Current setup uses SQLite (suitable for development)
- For production, migrate to PostgreSQL
- Add proper logging and monitoring
- Implement rate limiting
- Use HTTPS
- Set proper CORS origins

---

## Interactive API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These provide interactive documentation where you can test all endpoints directly.