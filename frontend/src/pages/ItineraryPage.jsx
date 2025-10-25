import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

// Map Modal Component
const MapModal = ({ isOpen, onClose, location, coordinates }) => {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);

  useEffect(() => {
    if (isOpen && coordinates && coordinates.lat && coordinates.lng) {
      // Dynamically load Leaflet CSS and JS
      const loadLeaflet = async () => {
        // Load CSS
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
          document.head.appendChild(link);
        }

        // Load JS
        if (!window.L) {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
          document.head.appendChild(script);

          script.onload = () => {
            initializeMap();
          };
        } else {
          initializeMap();
        }
      };

      const initializeMap = () => {
        if (mapRef.current && !mapInstanceRef.current) {
          const map = window.L.map(mapRef.current).setView(
            [coordinates.lat, coordinates.lng],
            15
          );

          window.L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap contributors",
            }
          ).addTo(map);

          // Create custom marker icon using div
          const customIcon = window.L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: #3B82F6; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 4px; margin-left: 8px; color: white; font-size: 16px;">📍</div></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -42],
          });

          window.L.marker([coordinates.lat, coordinates.lng], {
            icon: customIcon,
          })
            .addTo(map)
            .bindPopup(location)
            .openPopup();

          mapInstanceRef.current = map;
        }
      };

      loadLeaflet();
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, coordinates, location]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">{location}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <div className="mb-3 text-sm text-gray-600">
            <span className="font-medium">Coordinates:</span> {coordinates.lat},{" "}
            {coordinates.lng}
          </div>
          <div ref={mapRef} style={{ height: "400px", width: "100%" }}></div>
        </div>
      </div>
    </div>
  );
};

export default function ItineraryPage() {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateRequest, setUpdateRequest] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const [mapModal, setMapModal] = useState({
    isOpen: false,
    location: "",
    coordinates: null,
  });

  useEffect(() => {
    fetchItinerary();
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchItinerary = async () => {
    try {
      const response = await api.get(`/itinerary/${id}`);
      setItinerary(response.data);
    } catch {
      setError("Failed to load itinerary");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await api.get(`/activity/progress/${id}`);
      setProgress(response.data);
    } catch {
      console.error("Failed to load progress");
    }
  };

  const toggleActivityComplete = async (
    day,
    activityIndex,
    currentlyCompleted
  ) => {
    try {
      await api.post("/activity/progress", {
        itinerary_id: parseInt(id),
        day: day,
        activity_index: activityIndex,
        completed: !currentlyCompleted,
      });
      fetchProgress();
    } catch {
      console.error("Failed to update progress");
    }
  };

  const isActivityCompleted = (day, activityIndex) => {
    if (!progress || !progress.progress_details) return false;
    return progress.progress_details.some(
      (p) => p.day === day && p.activity_index === activityIndex && p.completed
    );
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateRequest.trim()) return;

    setUpdating(true);
    try {
      const response = await api.put(`/itinerary/${id}`, {
        itinerary_id: parseInt(id),
        update_request: updateRequest,
      });

      setItinerary((prev) => ({
        ...prev,
        itinerary_data: response.data.itinerary,
      }));
      setUpdateRequest("");

      // Reset progress after itinerary update
      setProgress(null);
      fetchProgress();
    } catch {
      setError("Failed to update itinerary");
    } finally {
      setUpdating(false);
    }
  };

  const openMapModal = (location, coordinates) => {
    setMapModal({ isOpen: true, location, coordinates });
  };

  const closeMapModal = () => {
    setMapModal({ isOpen: false, location: "", coordinates: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading itinerary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {itinerary.title}
          </h1>
          <div className="text-gray-600 mb-2">
            <span className="font-medium">Destination:</span>{" "}
            {itinerary.destination}
          </div>
          <div className="text-gray-600 mb-2">
            <span className="font-medium">Duration:</span>{" "}
            {itinerary.start_date} to {itinerary.end_date}
          </div>
          {itinerary.budget && (
            <div className="text-gray-600 mb-2">
              <span className="font-medium">Budget:</span> ₹
              {itinerary.budget.toLocaleString("en-IN")}
            </div>
          )}
        </div>

        {progress && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Your Progress</h3>
                <p className="text-sm text-gray-600">
                  {progress.completed_activities} of {progress.total_activities}{" "}
                  activities completed
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {progress.progress_percentage}%
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progress.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Itinerary Details
          </h2>
          {itinerary.itinerary_data && (
            <div className="grid grid-cols-1 gap-6">
              {JSON.parse(itinerary.itinerary_data).itinerary.days.map(
                (day) => (
                  <div
                    key={day.day}
                    className="bg-white p-6 rounded-lg shadow-md border"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Day {day.day}
                        </h3>
                        <p className="text-gray-600">{day.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-indigo-600">
                          {day.theme}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {day.activities.map((activity, index) => {
                        const completed = isActivityCompleted(day.day, index);
                        return (
                          <div
                            key={index}
                            className={`border-l-4 ${
                              completed
                                ? "border-green-500 bg-green-50"
                                : "border-indigo-500"
                            } pl-4 py-2 rounded`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-start flex-1">
                                <input
                                  type="checkbox"
                                  checked={completed}
                                  onChange={() =>
                                    toggleActivityComplete(
                                      day.day,
                                      index,
                                      completed
                                    )
                                  }
                                  className="mt-1 mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <p
                                      className={`font-semibold text-gray-900 ${
                                        completed ? "line-through" : ""
                                      }`}
                                    >
                                      {activity.time}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                      ₹{activity.cost.toLocaleString("en-IN")}
                                    </p>
                                  </div>
                                  <p
                                    className={`font-medium text-gray-800 ${
                                      completed ? "line-through" : ""
                                    }`}
                                  >
                                    {activity.activity}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-gray-600">
                                      {activity.location}
                                    </p>
                                    {activity.coordinates &&
                                      activity.coordinates.lat &&
                                      activity.coordinates.lng && (
                                        <button
                                          onClick={() =>
                                            openMapModal(
                                              activity.location,
                                              activity.coordinates
                                            )
                                          }
                                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                          title="View on map"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </button>
                                      )}
                                  </div>
                                  {activity.coordinates &&
                                    activity.coordinates.lat &&
                                    activity.coordinates.lng && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        📍 {activity.coordinates.lat.toFixed(4)}
                                        , {activity.coordinates.lng.toFixed(4)}
                                      </p>
                                    )}
                                  <p className="text-sm text-gray-500 mt-1">
                                    {activity.duration}
                                  </p>
                                  {activity.description && (
                                    <p className="text-sm text-gray-600 mt-2 italic">
                                      {activity.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        Activities: {day.activities.length}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        Daily Total: ₹
                        {day.activities
                          .reduce((sum, act) => sum + act.cost, 0)
                          .toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                )
              )}

              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-center font-medium text-indigo-900">
                  Total Estimated Cost: ₹
                  {JSON.parse(
                    itinerary.itinerary_data
                  ).itinerary.total_estimated_cost.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Update Itinerary
          </h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <textarea
              value={updateRequest}
              onChange={(e) => setUpdateRequest(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the changes you'd like to make to your itinerary..."
            />
            <button
              type="submit"
              disabled={updating || !updateRequest.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update Itinerary"}
            </button>
          </form>
        </div>
      </div>

      {/* Map Modal */}
      <MapModal
        isOpen={mapModal.isOpen}
        onClose={closeMapModal}
        location={mapModal.location}
        coordinates={mapModal.coordinates}
      />
    </div>
  );
}
