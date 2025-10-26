import google.generativeai as genai
import json
from typing import List, Dict
from fastapi import HTTPException
from utils.config import GEMINI_API_KEY
from models.schemas import TripRequest

# Initialize Gemini
genai.configure(api_key=GEMINI_API_KEY)


class GeminiTravelAgent:
    def __init__(self):
        # Configure with timeout settings
        self.model = genai.GenerativeModel(
            "gemini-2.0-flash-exp",
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                # "max_output_tokens": 8192,
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
- Special requests: {trip_request.preferences}

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


# Initialize Gemini agent singleton
gemini_agent = GeminiTravelAgent()
