import React, { useState, useEffect, useRef } from "react";
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

          window.L.marker([coordinates.lat, coordinates.lng])
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

const isItineraryResponse = (content) => {
  try {
    const parsed = JSON.parse(content);
    return parsed.message && parsed.itinerary;
  } catch (e) {
    return false;
  }
};

const ItineraryDisplay = ({ content }) => {
  const [mapModal, setMapModal] = useState({
    isOpen: false,
    location: "",
    coordinates: null,
  });

  const openMapModal = (location, coordinates) => {
    setMapModal({ isOpen: true, location, coordinates });
  };

  const closeMapModal = () => {
    setMapModal({ isOpen: false, location: "", coordinates: null });
  };

  try {
    const { message, itinerary } = JSON.parse(content);

    return (
      <div className="space-y-6">
        <div className="text-lg font-medium text-gray-900 mb-4">{message}</div>

        <div className="grid grid-cols-1 gap-6 mt-4">
          {itinerary.days.map((day) => (
            <div
              key={day.day}
              className="bg-white p-6 rounded-lg shadow border"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold">Day {day.day}</h3>
                  <p className="text-gray-600">{day.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">
                    {day.theme}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {day.activities.map((activity, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">
                          {activity.time} - {activity.activity}
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
                              📍 {activity.coordinates.lat.toFixed(4)},{" "}
                              {activity.coordinates.lng.toFixed(4)}
                            </p>
                          )}
                        <p className="text-sm text-gray-500">
                          Duration: {activity.duration}
                        </p>
                        {activity.description && (
                          <p className="text-sm mt-1">{activity.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${activity.cost}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 text-right">
                  Daily activities: {day.activities.length}
                </p>
              </div>
            </div>
          ))}

          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <p className="text-center font-medium text-blue-900">
              Total Estimated Cost: ${itinerary.total_estimated_cost}
            </p>
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
  } catch (e) {
    return <div className="text-red-500">Error displaying itinerary</div>;
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

    // Add user message to UI immediately
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

      const { conversation_id, response: aiResponse } = response.data;

      if (!conversationId) {
        setConversationId(conversation_id);
      }

      // Add AI response to UI
      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        role: "assistant",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the user message if there was an error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="bg-white rounded-lg shadow-lg flex-1 flex flex-col">
        <div className="border-b p-4">
          <h1 className="text-2xl font-bold text-gray-900">Travel Chat</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-4xl mb-4">🤖</div>
              <p>Start a conversation about your travel plans!</p>
              <p className="text-sm mt-2">
                Ask me anything about destinations, activities, or planning
                tips.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-full lg:max-w-3xl px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {message.role === "assistant" &&
                  isItineraryResponse(message.content) ? (
                    <ItineraryDisplay content={message.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                  <div
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse">Thinking...</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="border-t p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask about travel plans, destinations, or get recommendations..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
