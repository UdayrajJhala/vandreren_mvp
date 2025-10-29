"""
Test script to demonstrate route optimization with time recalculation
Run this to see how the optimizer reorders activities and updates times
"""

import json
from utils.route_optimizer import optimize_itinerary_routes

# Sample itinerary with activities in suboptimal order
test_itinerary = {
    "itinerary": {
        "destination": "Test City",
        "duration": "1 day",
        "days": [
            {
                "day": 1,
                "date": "2025-10-29",
                "theme": "City Exploration",
                "activities": [
                    {
                        "time": "09:00",
                        "activity": "Start at Hotel",
                        "location": "Hotel Downtown",
                        "duration": "0.5 hours",
                        "cost": 0,
                        "coordinates": {"lat": 25.5775, "lng": 91.8808},
                    },
                    {
                        "time": "10:00",
                        "activity": "Visit Museum",
                        "location": "City Museum",
                        "duration": "2 hours",
                        "cost": 500,
                        "coordinates": {"lat": 25.6100, "lng": 91.9200},  # Far away
                    },
                    {
                        "time": "13:00",
                        "activity": "Lunch at Restaurant",
                        "location": "Local Restaurant",
                        "duration": "1 hour",
                        "cost": 400,
                        "coordinates": {
                            "lat": 25.5780,
                            "lng": 91.8815,
                        },  # Close to hotel!
                    },
                    {
                        "time": "15:00",
                        "activity": "Shopping Mall",
                        "location": "Shopping Center",
                        "duration": "2 hours",
                        "cost": 1000,
                        "coordinates": {
                            "lat": 25.5800,
                            "lng": 91.8850,
                        },  # Also close to hotel
                    },
                    {
                        "time": "18:00",
                        "activity": "Evening Park Walk",
                        "location": "City Park",
                        "duration": "1 hour",
                        "cost": 0,
                        "coordinates": {"lat": 25.6050, "lng": 91.9150},  # Near museum
                    },
                ],
            }
        ],
    }
}

print("=" * 80)
print("BEFORE OPTIMIZATION:")
print("=" * 80)
for activity in test_itinerary["itinerary"]["days"][0]["activities"]:
    print(f"{activity['time']} - {activity['activity']} at {activity['location']}")
    print(
        f"           Coordinates: ({activity['coordinates']['lat']}, {activity['coordinates']['lng']})"
    )

print("\n" + "=" * 80)
print("RUNNING OPTIMIZATION...")
print("=" * 80)
optimized = optimize_itinerary_routes(test_itinerary)

print("\n" + "=" * 80)
print("AFTER OPTIMIZATION:")
print("=" * 80)
for activity in optimized["itinerary"]["days"][0]["activities"]:
    print(f"{activity['time']} - {activity['activity']} at {activity['location']}")
    print(
        f"           Coordinates: ({activity['coordinates']['lat']}, {activity['coordinates']['lng']})"
    )

print("\n" + "=" * 80)
print("OPTIMIZATION RESULTS:")
print("=" * 80)
print(
    f"Total travel distance: {optimized['itinerary'].get('total_travel_distance_km', 0)} km"
)
if "estimated_time_saved_minutes" in optimized["itinerary"]:
    saved_mins = optimized["itinerary"]["estimated_time_saved_minutes"]
    print(f"Time saved: {saved_mins} minutes ({saved_mins/60:.1f} hours)")
print("=" * 80)
