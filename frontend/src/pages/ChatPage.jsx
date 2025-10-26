import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MapPin, AlertTriangle, Loader } from "lucide-react";

// Map Modal Component
const MapModal = ({ isOpen, onClose, location, coordinates, darkMode }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (isOpen && coordinates && coordinates.lat && coordinates.lng) {
      const loadLeaflet = async () => {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
          document.head.appendChild(link);
        }

        if (!window.L) {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
          document.head.appendChild(script);
          script.onload = () => initializeMap();
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

          const customIcon = window.L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: #6B7280; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 4px; margin-left: 8px; color: white; font-size: 16px;">📍</div></div>`,
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-xl transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <div className="mb-3 text-xs text-gray-400">
            <span className="font-medium">Coordinates:</span> {coordinates.lat},{" "}
            {coordinates.lng}
          </div>
          <div
            ref={mapRef}
            style={{ height: "400px", width: "100%", borderRadius: "8px" }}
          ></div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const isItineraryResponse = (content) => {
  try {
    const parsed = JSON.parse(content);
    return parsed.message && parsed.itinerary;
  } catch (e) {
    return false;
  }
};

const ItineraryDisplay = ({ content, darkMode, openMapModal }) => {
  try {
    const { message, itinerary } = JSON.parse(content);

    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-200 mb-3">
          {message}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {itinerary.days.map((day) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#252525] p-5 rounded-lg border border-gray-800"
            >
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-800">
                <div>
                  <h3 className="text-base font-semibold text-gray-200">
                    Day {day.day}
                  </h3>
                  <p className="text-xs text-gray-500">{day.date}</p>
                </div>
                <div className="text-xs font-medium text-gray-400">
                  {day.theme}
                </div>
              </div>

              <div className="space-y-3">
                {day.activities.map((activity, index) => (
                  <div key={index} className="border-l-2 border-gray-700 pl-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-200 text-sm">
                          {activity.time} - {activity.activity}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400 truncate">
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
                                className="text-gray-500 hover:text-gray-300 p-0.5 rounded transition-colors flex-shrink-0"
                                title="View on map"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                        {activity.coordinates && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            {activity.coordinates.lat.toFixed(4)},{" "}
                            {activity.coordinates.lng.toFixed(4)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Duration: {activity.duration}
                        </p>
                        {activity.description && (
                          <p className="text-xs mt-1 text-gray-500">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <div className="text-xs font-medium text-gray-400 flex-shrink-0">
                        ₹{activity.cost}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 text-right">
                  {day.activities.length} activities
                </p>
              </div>
            </motion.div>
          ))}

          <div className="bg-gray-700 p-3 rounded-lg mt-2">
            <p className="text-center text-sm font-medium text-gray-200">
              Total Estimated Cost: ₹{itinerary.total_estimated_cost}
            </p>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    return <div className="text-red-400 text-sm">Error displaying itinerary</div>;
  }
};

export default function ChatPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(
    id ? parseInt(id) : null
  );
  const [darkMode, setDarkMode] = useState(true);
  const [mapModal, setMapModal] = useState({
    isOpen: false,
    location: "",
    coordinates: null,
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(
        `/conversation/${conversationId}/messages`
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setLoading(true);

    const userMessage = {
      id: Date.now(),
      content: messageText,
      role: "user",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await api.post("/chat", {
        message: messageText,
        conversation_id: conversationId,
      });

      const {
        conversation_id,
        response: aiResponse,
        query_rejected,
      } = response.data;

      if (!conversationId) {
        setConversationId(conversation_id);
      }

      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        role: "assistant",
        created_at: new Date().toISOString(),
        rejected: query_rejected || false,
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (query_rejected) {
        showToast(
          "Query outside scope - Please ask travel-related questions",
          "warning"
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg = error.response?.data?.detail || "Failed to send message";
      showToast(errorMsg, "error");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-20 right-4 z-50 px-5 py-3 rounded-lg border text-sm bg-[#1a1a1a] border-gray-700 text-gray-200`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 4000);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 py-6 h-full flex flex-col w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] backdrop-blur-xl rounded-lg border border-gray-800 flex-1 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="border-b border-gray-800 px-6 py-4">
            <h1 className="text-lg font-semibold text-gray-100">
              AI Travel Assistant
            </h1>
            <p className="text-xs text-gray-500">
              Get personalized travel recommendations
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mt-12"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-200 mb-2">
                  Start Your Journey
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Ask me anything about destinations, activities, or planning
                  tips
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {[
                    "Plan a 3-day trip to Goa",
                    "Best places to visit in Kerala",
                    "Budget-friendly Delhi itinerary",
                    "Adventure activities in Himachal",
                  ].map((suggestion, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setNewMessage(suggestion)}
                      className="bg-[#252525] p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-all text-left text-sm text-gray-300"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-full lg:max-w-3xl px-5 py-3 rounded-lg text-sm ${
                        message.role === "user"
                          ? "bg-gray-700 text-gray-100"
                          : message.rejected
                          ? "bg-[#252525] border-2 border-gray-600"
                          : "bg-[#252525] border border-gray-800"
                      }`}
                    >
                      {message.rejected && (
                        <div className="flex items-center gap-2 mb-2 text-gray-400 font-medium text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Query Outside Scope</span>
                        </div>
                      )}
                      {message.role === "assistant" &&
                      isItineraryResponse(message.content) ? (
                        <ItineraryDisplay
                          content={message.content}
                          darkMode={darkMode}
                          openMapModal={(location, coordinates) =>
                            setMapModal({ isOpen: true, location, coordinates })
                          }
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-gray-200">
                          {message.content}
                        </div>
                      )}
                      <div
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-[#252525] border border-gray-800 px-5 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-gray-800 p-4"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask about destinations, activities, or planning tips..."
                className="flex-1 px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                disabled={loading}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="bg-gray-700 text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 font-medium transition-all flex items-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                Send
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>

      <MapModal
        isOpen={mapModal.isOpen}
        onClose={() =>
          setMapModal({ isOpen: false, location: "", coordinates: null })
        }
        location={mapModal.location}
        coordinates={mapModal.coordinates}
        darkMode={darkMode}
      />
    </div>
  );
}
