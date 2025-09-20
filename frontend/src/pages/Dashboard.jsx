import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import CreateItineraryModal from "../components/CreateItineraryModal";

export default function Dashboard() {
  const [itineraries, setItineraries] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itinerariesRes, conversationsRes] = await Promise.all([
        api.get("/itineraries"),
        api.get("/conversations"),
      ]);
      setItineraries(itinerariesRes.data);
      setConversations(conversationsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItineraryCreated = () => {
    setShowCreateModal(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Travel Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 text-center"
          >
            <div className="text-2xl mb-2">✈️</div>
            <div className="text-lg font-medium">Create New Itinerary</div>
            <div className="text-blue-100">Plan your next adventure</div>
          </button>

          <Link
            to="/chat"
            className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 text-center block"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="text-lg font-medium">Chat with AI</div>
            <div className="text-green-100">Get travel advice</div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your Itineraries
          </h2>
          <div className="space-y-4">
            {itineraries.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No itineraries yet. Create your first one!
              </div>
            ) : (
              itineraries.map((itinerary) => (
                <Link
                  key={itinerary.id}
                  to={`/itinerary/${itinerary.id}`}
                  className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {itinerary.title}
                  </h3>
                  <p className="text-gray-600 mb-2">{itinerary.destination}</p>
                  <p className="text-sm text-gray-500">
                    {itinerary.start_date} to {itinerary.end_date}
                  </p>
                  {itinerary.budget && (
                    <p className="text-sm text-blue-600 mt-2">
                      Budget: ${itinerary.budget}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Recent Conversations
          </h2>
          <div className="space-y-4">
            {conversations.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No conversations yet. Start chatting!
              </div>
            ) : (
              conversations.slice(0, 5).map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/chat/${conversation.id}`}
                  className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {conversation.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Updated:{" "}
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateItineraryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleItineraryCreated}
        />
      )}
    </div>
  );
}
