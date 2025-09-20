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
      {/* Hero Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Welcome to Your Travel Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Plan your perfect adventure with AI-powered itineraries and personalized travel recommendations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => setShowCreateModal(true)}
            className="group card p-8 text-center bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">✈️</div>
            <div className="text-xl font-bold mb-2">Create New Itinerary</div>
            <div className="text-blue-100">Plan your next adventure with AI</div>
            <div className="mt-4 text-sm opacity-90">Get personalized recommendations</div>
          </button>

          <Link
            to="/chat"
            className="group card p-8 text-center bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 block"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🤖</div>
            <div className="text-xl font-bold mb-2">Chat with AI Assistant</div>
            <div className="text-emerald-100">Get instant travel advice</div>
            <div className="mt-4 text-sm opacity-90">Ask questions, get recommendations</div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Itineraries Section */}
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-2xl mr-3">🗺️</span>
              Your Itineraries
            </h2>
            <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {itineraries.length} {itineraries.length === 1 ? 'Trip' : 'Trips'}
            </div>
          </div>
          
          <div className="space-y-4">
            {itineraries.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No itineraries yet</h3>
                <p className="text-gray-600 mb-6">Start planning your first adventure!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Create Your First Trip
                </button>
              </div>
            ) : (
              itineraries.map((itinerary, index) => (
                <Link
                  key={itinerary.id}
                  to={`/itinerary/${itinerary.id}`}
                  className="group card p-6 block"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-1">
                        {itinerary.title}
                      </h3>
                      <p className="text-gray-600 font-medium">{itinerary.destination}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl mb-1">📍</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>📅 {itinerary.start_date} to {itinerary.end_date}</span>
                    {itinerary.budget && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        💰 ${itinerary.budget}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Created {new Date(itinerary.created_at).toLocaleDateString()}
                    </span>
                    <div className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Conversations Section */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-2xl mr-3">💬</span>
              Recent Conversations
            </h2>
            <div className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
              {conversations.length} {conversations.length === 1 ? 'Chat' : 'Chats'}
            </div>
          </div>
          
          <div className="space-y-4">
            {conversations.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">💭</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600 mb-6">Start a chat with our AI travel assistant!</p>
                <Link
                  to="/chat"
                  className="btn-secondary"
                >
                  Start Chatting
                </Link>
              </div>
            ) : (
              conversations.slice(0, 5).map((conversation, index) => (
                <Link
                  key={conversation.id}
                  to={`/chat/${conversation.id}`}
                  className="group card p-4 block"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200 mb-1">
                        {conversation.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Updated {new Date(conversation.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="group-hover:translate-x-1 transition-transform duration-200">
                        →
                      </div>
                    </div>
                  </div>
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
