from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from geopy.distance import geodesic
import math
from datetime import datetime, timedelta


def calculate_distance(coord1: tuple, coord2: tuple) -> float:
    """Calculate distance between two coordinates in kilometers"""
    try:
        return geodesic(coord1, coord2).kilometers
    except Exception as e:
        print(f"Error calculating distance: {str(e)}")
        return 0.0


def estimate_travel_time(distance_km: float) -> int:
    """
    Estimate travel time in minutes based on distance
    Assumes average speed of 30 km/h (accounting for city traffic, stops, etc.)
    """
    avg_speed_kmh = 30
    travel_time_hours = distance_km / avg_speed_kmh
    return int(travel_time_hours * 60)  # Convert to minutes


def parse_time(time_str: str) -> datetime:
    """Parse time string (HH:MM) to datetime object"""
    try:
        return datetime.strptime(time_str, "%H:%M")
    except:
        return datetime.strptime("09:00", "%H:%M")  # Default fallback


def parse_duration(duration_str: str) -> int:
    """Parse duration string to minutes"""
    try:
        # Handle formats like "1 hour", "2 hours", "30 minutes", "1.5 hours"
        duration_str = duration_str.lower().strip()

        if "hour" in duration_str:
            hours = float(duration_str.split()[0])
            return int(hours * 60)
        elif "minute" in duration_str:
            minutes = float(duration_str.split()[0])
            return int(minutes)
        else:
            # Try to parse as float (assume hours)
            return int(float(duration_str) * 60)
    except:
        return 60  # Default 1 hour


def optimize_route(activities: list) -> list:
    """
    Optimize the order of activities using a nearest neighbor algorithm
    Recalculates times based on optimized route
    Returns activities in optimized order with updated times
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

    # Activities without coordinates (keep at the end, sorted by original time)
    activities_without_coords = [
        a
        for a in activities
        if not a.get("coordinates")
        or not a["coordinates"].get("lat")
        or not a["coordinates"].get("lng")
    ]

    if len(activities_with_coords) <= 1:
        return activities

    # Start with the first activity (preserve starting time)
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

    # Recalculate times based on optimized order
    current_time = parse_time(optimized[0].get("time", "09:00"))

    for i, activity in enumerate(optimized):
        # Set the current activity's time
        activity["time"] = current_time.strftime("%H:%M")

        # Calculate time for next activity
        if i < len(optimized) - 1:
            # Add activity duration
            activity_duration = parse_duration(activity.get("duration", "1 hour"))
            current_time += timedelta(minutes=activity_duration)

            # Add travel time to next location
            next_activity = optimized[i + 1]
            distance = calculate_distance(
                (activity["coordinates"]["lat"], activity["coordinates"]["lng"]),
                (
                    next_activity["coordinates"]["lat"],
                    next_activity["coordinates"]["lng"],
                ),
            )
            travel_time = estimate_travel_time(distance)
            current_time += timedelta(minutes=travel_time)

    # Add activities without coordinates at the end, maintaining their relative order
    if activities_without_coords:
        activities_without_coords.sort(key=lambda a: parse_time(a.get("time", "09:00")))
        optimized.extend(activities_without_coords)

    return optimized


def optimize_itinerary_routes(itinerary_data: dict) -> dict:
    """
    Optimize routes for all days in an itinerary
    Reorders activities by proximity and recalculates times
    Returns the itinerary with optimized activity orders and updated times
    """
    if "itinerary" in itinerary_data:
        itinerary = itinerary_data["itinerary"]
    else:
        itinerary = itinerary_data

    if "days" not in itinerary:
        return itinerary_data

    total_distance = 0
    total_time_saved = 0

    for day in itinerary["days"]:
        if "activities" in day and len(day["activities"]) > 1:
            original_activities = day["activities"].copy()

            # Calculate original route distance
            original_dist = 0
            for i in range(len(original_activities) - 1):
                if original_activities[i].get("coordinates") and original_activities[
                    i + 1
                ].get("coordinates"):
                    original_dist += calculate_distance(
                        (
                            original_activities[i]["coordinates"]["lat"],
                            original_activities[i]["coordinates"]["lng"],
                        ),
                        (
                            original_activities[i + 1]["coordinates"]["lat"],
                            original_activities[i + 1]["coordinates"]["lng"],
                        ),
                    )

            # Optimize route with time recalculation
            optimized_activities = optimize_route(day["activities"])

            # Calculate optimized route distance
            optimized_dist = 0
            for i in range(len(optimized_activities) - 1):
                if optimized_activities[i].get("coordinates") and optimized_activities[
                    i + 1
                ].get("coordinates"):
                    optimized_dist += calculate_distance(
                        (
                            optimized_activities[i]["coordinates"]["lat"],
                            optimized_activities[i]["coordinates"]["lng"],
                        ),
                        (
                            optimized_activities[i + 1]["coordinates"]["lat"],
                            optimized_activities[i + 1]["coordinates"]["lng"],
                        ),
                    )

            day["activities"] = optimized_activities
            total_distance += optimized_dist

            distance_saved = original_dist - optimized_dist
            if distance_saved > 0:
                total_time_saved += estimate_travel_time(distance_saved)
                print(
                    f"Day {day.get('day', '?')}: Saved {distance_saved:.2f} km (~{estimate_travel_time(distance_saved)} mins)"
                )

    # Add route optimization info
    if "itinerary" in itinerary_data:
        itinerary_data["itinerary"]["route_optimized"] = True
        itinerary_data["itinerary"]["total_travel_distance_km"] = round(
            total_distance, 2
        )
        if total_time_saved > 0:
            itinerary_data["itinerary"][
                "estimated_time_saved_minutes"
            ] = total_time_saved
    else:
        itinerary_data["route_optimized"] = True
        itinerary_data["total_travel_distance_km"] = round(total_distance, 2)
        if total_time_saved > 0:
            itinerary_data["estimated_time_saved_minutes"] = total_time_saved

    print(f"✓ Route optimization complete: {total_distance:.2f} km total distance")
    if total_time_saved > 0:
        print(
            f"✓ Estimated time saved: {total_time_saved} minutes ({total_time_saved/60:.1f} hours)"
        )

    return itinerary_data
