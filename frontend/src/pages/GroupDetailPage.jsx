import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Users, UserPlus, Calendar, Trash2, MapPin, X } from "lucide-react";

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateItineraryModal, setShowCreateItineraryModal] =
    useState(false);
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");
  const [userItineraries, setUserItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);

  // Itinerary creation form
  const [itineraryForm, setItineraryForm] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    preferences: "",
  });
  const [creatingItinerary, setCreatingItinerary] = useState(false);

  const fetchGroupDetails = async () => {
    try {
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data);
    } catch {
      setError("Failed to load group details");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserItineraries = async () => {
    try {
      const response = await api.get("/itineraries");
      // Filter out itineraries that are already in this group
      const availableItineraries = response.data.filter(
        (itin) => !itin.is_group || itin.group_id !== parseInt(id)
      );
      setUserItineraries(availableItineraries);
    } catch {
      setError("Failed to load itineraries");
    }
  };

  useEffect(() => {
    fetchGroupDetails();
    fetchUserItineraries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/groups/${id}/invite`, {
        group_id: parseInt(id),
        user_email: inviteEmail,
      });
      setShowInviteModal(false);
      setInviteEmail("");
      fetchGroupDetails();
      showToast("Invitation sent successfully!", "success");
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to invite user";
      setError(errorMsg);

      // Show toast for user not found
      if (error.response?.status === 404) {
        showToast("User not found with this email", "error");
      } else if (error.response?.status === 400) {
        showToast(errorMsg, "error");
      }
    }
  };

  const showToast = (message, type = "info") => {
    // Create a toast notification
    const toast = document.createElement("div");
    toast.className = `fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
      type === "success"
        ? "bg-green-500"
        : type === "error"
        ? "bg-red-500"
        : "bg-blue-500"
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleCreateItinerary = async (e) => {
    e.preventDefault();
    setError("");
    setCreatingItinerary(true);

    try {
      const response = await api.post(`/groups/${id}/itinerary`, {
        destination: itineraryForm.destination,
        start_date: itineraryForm.startDate,
        end_date: itineraryForm.endDate,
        budget: itineraryForm.budget ? parseFloat(itineraryForm.budget) : null,
        preferences: itineraryForm.preferences || null,
      });

      setShowCreateItineraryModal(false);
      setItineraryForm({
        destination: "",
        startDate: "",
        endDate: "",
        budget: "",
        preferences: "",
      });

      // Navigate to the newly created itinerary
      navigate(`/itinerary/${response.data.itinerary_id}`);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Failed to create itinerary. Please try again."
      );
    } finally {
      setCreatingItinerary(false);
    }
  };

  const handleAddExistingItinerary = async () => {
    if (!selectedItinerary) return;
    setError("");

    try {
      // Add the itinerary to this group using the new endpoint
      await api.post(`/groups/${id}/add-itinerary/${selectedItinerary}`);

      setShowAddExistingModal(false);
      setSelectedItinerary(null);
      fetchGroupDetails();
      fetchUserItineraries();
    } catch (error) {
      setError(
        error.response?.data?.detail || "Failed to add itinerary to group"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading group...</div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  const canManageGroup =
    group.user_role === "creator" || group.user_role === "admin";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Group Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{group.name}</h1>
            <p className="text-blue-100 text-lg mb-4">{group.description}</p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {group.members.length} Members
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {group.itineraries.length} Itineraries
              </div>
            </div>
          </div>
          {canManageGroup && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Members
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Members</h2>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {member.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {member.full_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        @{member.username}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Itineraries Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Group Itineraries
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddExistingModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  + Add Existing
                </button>
                <button
                  onClick={() => setShowCreateItineraryModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  + New Itinerary
                </button>
              </div>
            </div>

            {group.itineraries.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No itineraries yet</p>
                <button
                  onClick={() => setShowCreateItineraryModal(true)}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create First Itinerary
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.itineraries.map((itinerary) => (
                  <Link
                    key={itinerary.id}
                    to={`/itinerary/${itinerary.id}`}
                    className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <h3 className="font-bold text-gray-900 mb-2">
                      {itinerary.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {itinerary.destination}
                    </p>
                    <p className="text-sm text-gray-500">
                      {itinerary.start_date} to {itinerary.end_date}
                    </p>
                    {itinerary.budget && (
                      <p className="text-sm text-blue-600 mt-2">
                        Budget: ₹{itinerary.budget.toLocaleString("en-IN")}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invite Member
            </h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Email *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setError("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Itinerary Modal */}
      {showCreateItineraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Create Group Itinerary
              </h2>
              <button
                onClick={() => {
                  setShowCreateItineraryModal(false);
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateItinerary} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination *
                </label>
                <input
                  type="text"
                  required
                  value={itineraryForm.destination}
                  onChange={(e) =>
                    setItineraryForm({
                      ...itineraryForm,
                      destination: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Paris, France"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={itineraryForm.startDate}
                    onChange={(e) =>
                      setItineraryForm({
                        ...itineraryForm,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={itineraryForm.endDate}
                    onChange={(e) =>
                      setItineraryForm({
                        ...itineraryForm,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (₹)
                </label>
                <input
                  type="number"
                  value={itineraryForm.budget}
                  onChange={(e) =>
                    setItineraryForm({
                      ...itineraryForm,
                      budget: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferences
                </label>
                <textarea
                  value={itineraryForm.preferences}
                  onChange={(e) =>
                    setItineraryForm({
                      ...itineraryForm,
                      preferences: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Adventure activities, local cuisine, cultural sites..."
                  rows={3}
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateItineraryModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={creatingItinerary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingItinerary}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {creatingItinerary ? "Creating..." : "Create Itinerary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Existing Itinerary Modal */}
      {showAddExistingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Add Existing Itinerary
              </h2>
              <button
                onClick={() => {
                  setShowAddExistingModal(false);
                  setSelectedItinerary(null);
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {userItineraries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  You don't have any available itineraries to add.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Select an itinerary to add to this group:
                </p>
                {userItineraries.map((itinerary) => (
                  <div
                    key={itinerary.id}
                    onClick={() => setSelectedItinerary(itinerary.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedItinerary === itinerary.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h3 className="font-bold text-gray-900 mb-1">
                      {itinerary.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {itinerary.destination}
                    </p>
                    <p className="text-sm text-gray-500">
                      {itinerary.start_date} to {itinerary.end_date}
                    </p>
                    {itinerary.budget && (
                      <p className="text-sm text-blue-600 mt-1">
                        Budget: ₹{itinerary.budget.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && <div className="text-red-600 text-sm mt-4">{error}</div>}

            {userItineraries.length > 0 && (
              <div className="flex justify-end space-x-4 pt-4 mt-4 border-t">
                <button
                  onClick={() => {
                    setShowAddExistingModal(false);
                    setSelectedItinerary(null);
                    setError("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExistingItinerary}
                  disabled={!selectedItinerary}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add to Group
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
