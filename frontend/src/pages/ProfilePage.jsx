import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function ProfilePage() {
  const [preferences, setPreferences] = useState({
    interests: [],
    travel_style: "balanced",
    dietary_restrictions: [],
    budget_preference: "mid-range",
    accommodation_type: "hotel",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    interests: "",
    travel_style: "balanced",
    dietary_restrictions: "",
    budget_preference: "mid-range",
    accommodation_type: "hotel",
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get("/user/preferences");
      setPreferences(response.data);
      setFormData({
        interests: response.data.interests?.join(", ") || "",
        travel_style: response.data.travel_style || "balanced",
        dietary_restrictions:
          response.data.dietary_restrictions?.join(", ") || "",
        budget_preference: response.data.budget_preference || "mid-range",
        accommodation_type: response.data.accommodation_type || "hotel",
      });
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const updateData = {
        interests: formData.interests
          .split(",")
          .map((i) => i.trim())
          .filter((i) => i),
        travel_style: formData.travel_style,
        dietary_restrictions: formData.dietary_restrictions
          .split(",")
          .map((i) => i.trim())
          .filter((i) => i),
        budget_preference: formData.budget_preference,
        accommodation_type: formData.accommodation_type,
      };

      await api.put("/user/preferences", updateData);
      setPreferences(updateData);
      setMessage("Preferences updated successfully!");
    } catch (error) {
      setMessage("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Travel Preferences
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interests
            </label>
            <input
              name="interests"
              type="text"
              value={formData.interests}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="museums, food, nature, adventure, beaches"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple interests with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel Style
            </label>
            <select
              name="travel_style"
              value={formData.travel_style}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relaxed">
                Relaxed - Take it easy, plenty of downtime
              </option>
              <option value="balanced">
                Balanced - Mix of activities and relaxation
              </option>
              <option value="packed">
                Packed - Action-packed, see everything
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions
            </label>
            <input
              name="dietary_restrictions"
              type="text"
              value={formData.dietary_restrictions}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="vegetarian, vegan, gluten-free, kosher, halal"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple restrictions with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Preference
            </label>
            <select
              name="budget_preference"
              value={formData.budget_preference}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="budget">Budget - Keep costs low</option>
              <option value="mid-range">
                Mid-range - Balance cost and comfort
              </option>
              <option value="luxury">Luxury - Premium experiences</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accommodation Type
            </label>
            <select
              name="accommodation_type"
              value={formData.accommodation_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hotel">Hotel</option>
              <option value="hostel">Hostel</option>
              <option value="airbnb">Airbnb</option>
              <option value="resort">Resort</option>
            </select>
          </div>

          {message && (
            <div
              className={`text-sm ${
                message.includes("success") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            How Preferences Work
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • Your preferences help our AI create personalized itineraries
            </li>
            <li>• Changes apply to new itineraries and chat conversations</li>
            <li>
              • You can always override preferences with specific requests
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
