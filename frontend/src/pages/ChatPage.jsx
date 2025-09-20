import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

const isItineraryResponse = (content) => {
  try {
    const parsed = JSON.parse(content);
    return parsed.message && parsed.itinerary;
  } catch (e) {
    return false;
  }
};

const ItineraryDisplay = ({ content }) => {
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
                      <div>
                        <p className="font-semibold">
                          {activity.time} - {activity.activity}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.location}
                        </p>
                        <p className="text-sm text-gray-500">
                          Duration: {activity.duration}
                        </p>
                        <p className="text-sm mt-1">{activity.description}</p>
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
    <div className="max-w-6xl mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="card flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Travel Assistant</h1>
              <p className="text-blue-100">Ask me anything about travel planning!</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center mt-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-4xl">✈️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Plan Your Adventure?</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Ask me about destinations, activities, travel tips, or let me help you create a personalized itinerary!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="card p-4 text-center">
                  <div className="text-2xl mb-2">🗺️</div>
                  <p className="text-sm font-medium">Destination Ideas</p>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl mb-2">🍽️</div>
                  <p className="text-sm font-medium">Food & Dining</p>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <p className="text-sm font-medium">Activity Planning</p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`max-w-full lg:max-w-4xl ${
                    message.role === "user" ? "order-2" : "order-1"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-sm">🤖</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">AI Assistant</span>
                    </div>
                  )}
                  
                  <div
                    className={`px-6 py-4 rounded-2xl shadow-lg ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-12"
                        : "bg-white text-gray-800 border border-gray-200 mr-12"
                    }`}
                  >
                    {message.role === "assistant" &&
                    isItineraryResponse(message.content) ? (
                      <ItineraryDisplay content={message.content} />
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    )}
                  </div>
                  
                  <div
                    className={`text-xs mt-2 ${
                      message.role === "user" ? "text-right text-gray-500 mr-12" : "text-gray-500 ml-12"
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
                
                {message.role === "user" && (
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center ml-3 order-1">
                    <span className="text-sm">👤</span>
                  </div>
                )}
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-sm">🤖</span>
                </div>
                <span className="text-sm font-medium text-gray-600">AI Assistant</span>
              </div>
              <div className="bg-white text-gray-800 px-6 py-4 rounded-2xl shadow-lg border border-gray-200 mr-12">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white p-6">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask about travel plans, destinations, or get recommendations..."
                className="w-full px-6 py-4 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                disabled={loading}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <div className="flex items-center">
                  <span className="mr-2">📤</span>
                  Send
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
