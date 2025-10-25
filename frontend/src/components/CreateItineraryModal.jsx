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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Create New Itinerary
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="destination"
            type="text"
            required
            value={formData.destination}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Destination (e.g., Paris, France)"
          />

          <input
            name="start_date"
            type="date"
            required
            value={formData.start_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="end_date"
            type="date"
            required
            value={formData.end_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="budget"
            type="number"
            step="1"
            value={formData.budget}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Budget in ₹ (Indian Rupees) - Optional"
          />

          <input
            name="travelers"
            type="number"
            min="1"
            value={formData.travelers}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Number of travelers"
          />

          <textarea
            name="special_requests"
            value={formData.special_requests}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Special requests or preferences"
          />

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Itinerary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
