import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  Circle,
  Edit3,
  Loader,
  TrendingUp,
} from "lucide-react";

// Map Modal Component
const MapModal = ({ isOpen, onClose, location, coordinates }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (isOpen && coordinates && coordinates.lat && coordinates.lng) {
      const loadLeaflet = async () => {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
          document.head.appendChild(link);
        }

        if (!window.L) {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
          document.head.appendChild(script);
          script.onload = () => initializeMap();
        } else {
          initializeMap();
        }
      };

      const initializeMap = () => {
        if (mapRef.current && !mapInstanceRef.current) {
          const map = window.L.map(mapRef.current).setView([coordinates.lat, coordinates.lng], 15);
          window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(map);

          const customIcon = window.L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: #6B7280; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 4px; margin-left: 8px; color: white; font-size: 16px;">📍</div></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -42],
          });

          window.L.marker([coordinates.lat, coordinates.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(location)
            .openPopup();

          mapInstanceRef.current = map;
        }
      };

      loadLeaflet();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, coordinates, location]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden border border-gray-800"
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-200">{location}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-xl transition-colors">
            ×
          </button>
        </div>
        <div className="p-4">
          <div className="mb-3 text-xs text-gray-400">
            <span className="font-medium">Coordinates:</span> {coordinates.lat}, {coordinates.lng}
          </div>
          <div ref={mapRef} style={{ height: "400px", width: "100%", borderRadius: "8px" }}></div>
        </div>
      </motion.div>
    </motion.div>
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

  const toggleActivityComplete = async (day, activityIndex, currentlyCompleted) => {
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
      setProgress(null);
      fetchProgress();
    } catch {
      setError("Failed to update itinerary");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader className="w-8 h-8 text-gray-500" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-center text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-100 mb-4">{itinerary.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Destination</p>
                <p className="text-sm font-medium text-gray-200">{itinerary.destination}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-200">
                  {itinerary.start_date} to {itinerary.end_date}
                </p>
              </div>
            </div>
            {itinerary.budget && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-sm font-medium text-gray-200">
                    ₹{itinerary.budget.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress Section */}
        {progress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                  <h3 className="text-base font-semibold text-gray-200">Your Progress</h3>
                </div>
                <p className="text-sm text-gray-400">
                  {progress.completed_activities} of {progress.total_activities} activities completed
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-200">{progress.progress_percentage}%</div>
                <div className="w-32 bg-gray-800 rounded-full h-2 mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.progress_percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gray-600 h-2 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Itinerary Days */}
        <div className="space-y-4 mb-6">
          {itinerary.itinerary_data &&
            JSON.parse(itinerary.itinerary_data).itinerary.days.map((day, dayIndex) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.05 }}
                className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-5"
              >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200">Day {day.day}</h3>
                    <p className="text-xs text-gray-500">{day.date}</p>
                  </div>
                  <div className="text-xs font-medium text-gray-400">{day.theme}</div>
                </div>

                <div className="space-y-3">
                  {day.activities.map((activity, index) => {
                    const completed = isActivityCompleted(day.day, index);
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ x: 4 }}
                        className={`border-l-2 pl-3 py-2 rounded-r transition-all ${
                          completed ? "border-gray-600 bg-gray-800/30" : "border-gray-700"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => toggleActivityComplete(day.day, index, completed)}
                            className="mt-0.5"
                          >
                            {completed ? (
                              <CheckCircle className="w-5 h-5 text-gray-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <p
                                className={`text-sm font-medium text-gray-200 ${
                                  completed ? "line-through opacity-50" : ""
                                }`}
                              >
                                {activity.time} - {activity.activity}
                              </p>
                              <p className="text-xs font-medium text-gray-400 whitespace-nowrap">
                                ₹{activity.cost.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs text-gray-500 truncate">{activity.location}</p>
                              {activity.coordinates && activity.coordinates.lat && activity.coordinates.lng && (
                                <button
                                  onClick={() =>
                                    setMapModal({
                                      isOpen: true,
                                      location: activity.location,
                                      coordinates: activity.coordinates,
                                    })
                                  }
                                  className="text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">Duration: {activity.duration}</p>
                            {activity.description && (
                              <p className="text-xs text-gray-500 mt-1 italic">{activity.description}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between items-center text-xs">
                    <p className="text-gray-500">{day.activities.length} activities</p>
                    <p className="font-medium text-gray-400">
                      Daily Total: ₹
                      {day.activities.reduce((sum, act) => sum + act.cost, 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

          {/* Total Cost */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-700 p-4 rounded-lg"
          >
            <p className="text-center font-semibold text-gray-200 text-sm">
              Total Estimated Cost: ₹
              {JSON.parse(itinerary.itinerary_data).itinerary.total_estimated_cost.toLocaleString("en-IN")}
            </p>
          </motion.div>
        </div>

        {/* Update Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-200">Update Itinerary</h2>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <textarea
              value={updateRequest}
              onChange={(e) => setUpdateRequest(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors text-sm resize-none"
              placeholder="Describe the changes you'd like to make..."
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={updating || !updateRequest.trim()}
              className="bg-gray-700 text-gray-200 px-6 py-2.5 rounded-lg hover:bg-gray-600 disabled:opacity-50 font-medium transition-all text-sm"
            >
              {updating ? "Updating..." : "Update Itinerary"}
            </motion.button>
          </form>
        </motion.div>
      </div>

      <MapModal
        isOpen={mapModal.isOpen}
        onClose={() => setMapModal({ isOpen: false, location: "", coordinates: null })}
        location={mapModal.location}
        coordinates={mapModal.coordinates}
      />
    </div>
  );
}
