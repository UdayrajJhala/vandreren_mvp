import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function CreateItineraryModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [formData, setFormData] = useState({
    destination: "",
    start_date: "",
    end_date: "",
    budget: "",
    travelers: 1,
    special_requests: "",
  });

  const loadingSteps = [
    { text: "Scraping reviews...", duration: 8000 },
    { text: "Performing similarity search...", duration: 8000 },
    { text: "Creating your itinerary...", duration: null },
  ];

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get minimum end date (day after start date)
  const getMinEndDate = () => {
    if (!formData.start_date) return getTodayDate();
    const startDate = new Date(formData.start_date);
    startDate.setDate(startDate.getDate() + 1);
    return startDate.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    // Step 1: Scraping reviews (3 seconds)
    const timer1 = setTimeout(() => {
      setLoadingStep(1);
    }, 3000);

    // Step 2: Similarity search (3 seconds)
    const timer2 = setTimeout(() => {
      setLoadingStep(2);
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Additional validation before submission
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (startDate < today) {
      setError("Start date cannot be in the past");
      return;
    }

    if (endDate <= startDate) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    setError("");
    setLoadingStep(0);

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
      setLoadingStep(0);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "budget" && value !== "" && parseFloat(value) < 0) {
      return;
    }
    if (name === "travelers" && value !== "" && parseInt(value) < 1) {
      return;
    }

    // Clear error when user makes changes
    if (error) setError("");

    // If start_date is changed and end_date is before new start_date, clear end_date
    if (name === "start_date" && formData.end_date) {
      const newStartDate = new Date(value);
      const currentEndDate = new Date(formData.end_date);
      if (currentEndDate <= newStartDate) {
        setFormData((prev) => ({
          ...prev,
          start_date: value,
          end_date: "",
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
      >
        <div className="bg-[#1a1a1a] rounded-lg p-12 w-full max-w-md border border-gray-800">
          <div className="space-y-6">
            {loadingSteps.map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      index === loadingStep
                        ? "text-gray-200"
                        : index < loadingStep
                        ? "text-gray-500"
                        : "text-gray-600"
                    }`}
                  >
                    {step.text}
                  </span>
                  {index < loadingStep && (
                    <span className="text-gray-500 text-xs">✓</span>
                  )}
                  {index === loadingStep && (
                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{
                      width:
                        index < loadingStep
                          ? "100%"
                          : index === loadingStep
                          ? "100%"
                          : "0%",
                    }}
                    transition={{
                      duration: index === loadingStep ? 3 : 0.5,
                      ease: "linear",
                    }}
                    className={`h-full ${
                      index < loadingStep
                        ? "bg-gray-600"
                        : index === loadingStep
                        ? "bg-gray-400"
                        : "bg-gray-800"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1a1a1a] rounded-lg p-8 w-full max-w-2xl border border-gray-800 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-100 mb-1">
                Create Itinerary
              </h2>
              <p className="text-sm text-gray-500">
                Fill in the details to generate your personalized travel plan
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Destination
              </label>
              <input
                name="destination"
                type="text"
                required
                value={formData.destination}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                placeholder="Paris, France"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  name="start_date"
                  type="date"
                  required
                  min={getTodayDate()}
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-colors"
                />
                <p className="text-xs text-gray-600 mt-1.5">
                  Cannot be in the past
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  name="end_date"
                  type="date"
                  required
                  min={getMinEndDate()}
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={!formData.start_date}
                  className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 mt-1.5">
                  {formData.start_date
                    ? "Must be after start date"
                    : "Select start date first"}
                </p>
              </div>
            </div>

            {/* Budget and Travelers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget (₹)
                </label>
                <input
                  name="budget"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.budget}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E") {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                  placeholder="50000"
                />
                <p className="text-xs text-gray-600 mt-1.5">Optional</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Travelers
                </label>
                <input
                  name="travelers"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.travelers}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E") {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-colors"
                />
                <p className="text-xs text-gray-600 mt-1.5">Minimum 1</p>
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Special Requests & Preferences
              </label>
              <textarea
                name="special_requests"
                rows={4}
                value={formData.special_requests}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors resize-none"
                placeholder="Any specific preferences, activities, or dietary restrictions..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20"
              >
                {error}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Itinerary
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
