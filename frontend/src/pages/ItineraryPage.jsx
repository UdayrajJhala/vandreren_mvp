import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

export default function ItineraryPage() {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateRequest, setUpdateRequest] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchItinerary();
  }, [id]);

  const fetchItinerary = async () => {
    try {
      const response = await api.get(`/itinerary/${id}`);
      setItinerary(response.data);
    } catch (error) {
      setError("Failed to load itinerary");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateRequest.trim()) return;

    setUpdating(true);
    try {
      const response = await api.put(`/itinerary/${id}`, {
        itinerary_id: parseInt(id),
        update_request: updateRequest,
      });

      setItinerary((prev) => ({
        ...prev,
        itinerary_data: response.data.itinerary,
      }));
      setUpdateRequest("");
    } catch (error) {
      setError("Failed to update itinerary");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading itinerary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {itinerary.title}
          </h1>
          <div className="text-gray-600 mb-2">
            <span className="font-medium">Destination:</span>{" "}
            {itinerary.destination}
          </div>
          <div className="text-gray-600 mb-2">
            <span className="font-medium">Duration:</span>{" "}
            {itinerary.start_date} to {itinerary.end_date}
          </div>
          {itinerary.budget && (
            <div className="text-gray-600 mb-2">
              <span className="font-medium">Budget:</span> ${itinerary.budget}
            </div>
          )}
        </div>

        <div className="border-t pt-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Itinerary Details
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {itinerary.itinerary_data}
            </pre>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Update Itinerary
          </h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <textarea
              value={updateRequest}
              onChange={(e) => setUpdateRequest(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the changes you'd like to make to your itinerary..."
            />
            <button
              type="submit"
              disabled={updating || !updateRequest.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update Itinerary"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
