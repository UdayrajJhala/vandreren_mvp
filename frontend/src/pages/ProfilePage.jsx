import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { motion } from "framer-motion";
import {
  Heart,
  MapPin,
  DollarSign,
  Home,
  Save,
  Loader,
  Info,
} from "lucide-react";

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
  const [darkMode, setDarkMode] = useState(true);
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
      setTimeout(() => setMessage(""), 3000);
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-100 mb-1">
            Travel Preferences
          </h1>
          <p className="text-sm text-gray-500">
            Customize your travel experience with AI-powered recommendations
          </p>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 mb-6"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-gray-500" />
                Interests
              </label>
              <input
                name="interests"
                type="text"
                value={formData.interests}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                placeholder="museums, food, nature, adventure, beaches"
              />
              <p className="text-xs text-gray-600 mt-1.5">
                Separate multiple interests with commas
              </p>
            </div>

            {/* Travel Style */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Travel Style
              </label>
              <select
                name="travel_style"
                value={formData.travel_style}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-colors text-sm"
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

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dietary Restrictions
              </label>
              <input
                name="dietary_restrictions"
                type="text"
                value={formData.dietary_restrictions}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                placeholder="vegetarian, vegan, gluten-free, kosher, halal"
              />
              <p className="text-xs text-gray-600 mt-1.5">
                Separate multiple restrictions with commas
              </p>
            </div>

            {/* Budget Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                Budget Preference
              </label>
              <select
                name="budget_preference"
                value={formData.budget_preference}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-colors text-sm"
              >
                <option value="budget">Budget - Keep costs low</option>
                <option value="mid-range">
                  Mid-range - Balance cost and comfort
                </option>
                <option value="luxury">Luxury - Premium experiences</option>
              </select>
            </div>

            {/* Accommodation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Home className="w-4 h-4 text-gray-500" />
                Accommodation Type
              </label>
              <select
                name="accommodation_type"
                value={formData.accommodation_type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-colors text-sm"
              >
                <option value="hotel">Hotel</option>
                <option value="hostel">Hostel</option>
                <option value="airbnb">Airbnb</option>
                <option value="resort">Resort</option>
              </select>
            </div>

            {/* Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm p-3 rounded-lg bg-[#252525] border border-gray-700 text-gray-300"
              >
                {message}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="w-full bg-gray-700 text-gray-200 py-3 px-6 rounded-lg hover:bg-gray-600 disabled:opacity-50 font-medium transition-all flex items-center justify-center text-sm"
            >
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="mr-2"
                  >
                    <Loader className="w-4 h-4" />
                  </motion.div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-200 mb-3">
                How Preferences Work
              </h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  • Your preferences help our AI create personalized itineraries
                </p>
                <p>• Changes apply to new itineraries and chat conversations</p>
                <p>
                  • You can always override preferences with specific requests
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
