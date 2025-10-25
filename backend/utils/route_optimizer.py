from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from geopy.distance import geodesic
import math


def calculate_distance(coord1: tuple, coord2: tuple) -> float:
    """Calculate distance between two coordinates in kilometers"""
    try:
        return geodesic(coord1, coord2).kilometers
    except Exception as e:
        print(f"Error calculating distance: {str(e)}")
        return 0.0


def optimize_route(activities: list) -> list:
    """
    Optimize the order of activities using a nearest neighbor algorithm
    Returns activities in optimized order
    """
    if not activities or len(activities) <= 1:
        return activities

    # Filter activities that have valid coordinates
    activities_with_coords = [
        a
        for a in activities
        if a.get("coordinates")
        and a["coordinates"].get("lat")
        and a["coordinates"].get("lng")
    ]

    if len(activities_with_coords) <= 1:
        return activities

    # Start with the first activity
    optimized = [activities_with_coords[0]]
    remaining = activities_with_coords[1:]

    # Greedy nearest neighbor
    while remaining:
        current = optimized[-1]
        current_coords = (
            current["coordinates"]["lat"],
            current["coordinates"]["lng"],
        )

        # Find nearest unvisited activity
        nearest = min(
            remaining,
            key=lambda a: calculate_distance(
                current_coords, (a["coordinates"]["lat"], a["coordinates"]["lng"])
            ),
        )

        optimized.append(nearest)
        remaining.remove(nearest)

    return optimized


def optimize_itinerary_routes(itinerary_data: dict) -> dict:
    """
    Optimize routes for all days in an itinerary
    Returns the itinerary with optimized activity orders
    """
    if "itinerary" in itinerary_data:
        itinerary = itinerary_data["itinerary"]
    else:
        itinerary = itinerary_data

    if "days" not in itinerary:
        return itinerary_data

    total_distance = 0

    for day in itinerary["days"]:
        if "activities" in day and len(day["activities"]) > 1:
            original_activities = day["activities"].copy()
            optimized_activities = optimize_route(day["activities"])

            # Calculate distance saved
            original_dist = sum(
                calculate_distance(
                    (
                        original_activities[i]["coordinates"]["lat"],
                        original_activities[i]["coordinates"]["lng"],
                    ),
                    (
                        original_activities[i + 1]["coordinates"]["lat"],
                        original_activities[i + 1]["coordinates"]["lng"],
                    ),
                )
                for i in range(len(original_activities) - 1)
                if original_activities[i].get("coordinates")
                and original_activities[i + 1].get("coordinates")
            )

            optimized_dist = sum(
                calculate_distance(
                    (
                        optimized_activities[i]["coordinates"]["lat"],
                        optimized_activities[i]["coordinates"]["lng"],
                    ),
                    (
                        optimized_activities[i + 1]["coordinates"]["lat"],
                        optimized_activities[i + 1]["coordinates"]["lng"],
                    ),
                )
                for i in range(len(optimized_activities) - 1)
                if optimized_activities[i].get("coordinates")
                and optimized_activities[i + 1].get("coordinates")
            )

            day["activities"] = optimized_activities
            total_distance += optimized_dist

    # Add route optimization info
    if "itinerary" in itinerary_data:
        itinerary_data["itinerary"]["route_optimized"] = True
        itinerary_data["itinerary"]["total_travel_distance_km"] = round(
            total_distance, 2
        )
    else:
        itinerary_data["route_optimized"] = True
        itinerary_data["total_travel_distance_km"] = round(total_distance, 2)

    return itinerary_data
