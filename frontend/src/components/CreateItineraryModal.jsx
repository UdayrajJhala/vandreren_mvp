import React, { useState } from "react";
import { api } from "../services/api";

export default function CreateItineraryModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    destination: "",
    start_date: "",
    end_date: "",
    budget: "",
    travelers: 1,
    special_requests: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const requestData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        travelers: parseInt(formData.travelers),
      };

      await api.post("/itinerary/create", requestData);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to create itinerary");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-3">✈️</span>
                Create New Itinerary
              </h2>
              <p className="text-blue-100 mt-1">Plan your perfect adventure</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🗺️ Destination
              </label>
              <input
                name="destination"
                type="text"
                required
                value={formData.destination}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Paris, France or Tokyo, Japan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Start Date
                </label>
                <input
                  name="start_date"
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 End Date
                </label>
                <input
                  name="end_date"
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Budget (Optional)
                </label>
                <input
                  name="budget"
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Total budget"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👥 Travelers
                </label>
                <input
                  name="travelers"
                  type="number"
                  min="1"
                  value={formData.travelers}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Number of people"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💭 Special Requests
              </label>
              <textarea
                name="special_requests"
                value={formData.special_requests}
                onChange={handleChange}
                rows={3}
                className="input-field resize-none"
                placeholder="Any special preferences, must-see places, dietary requirements, etc."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-2">🚀</span>
                    Create Itinerary
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
