import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Trash2,
  MapPin,
  Calendar,
  Crown,
  X,
  Plus,
  FolderPlus,
  Loader,
  ArrowRight,
} from "lucide-react";

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateItineraryModal, setShowCreateItineraryModal] = useState(false);
  const [showAddItineraryModal, setShowAddItineraryModal] = useState(false);

  const [inviteUsername, setInviteUsername] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  // New itinerary form states
  const [newItinerary, setNewItinerary] = useState({
    destination: "",
    start_date: "",
    end_date: "",
    budget: "",
    preferences: "",
  });

  // User's existing itineraries
  const [userItineraries, setUserItineraries] = useState([]);
  const [selectedItineraryId, setSelectedItineraryId] = useState("");

  useEffect(() => {
    fetchGroupDetails();
    fetchUserItineraries();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      const response = await api.get(`/groups/${id}`);
      const data = response.data;
      setGroup(data);
      setMembers(data.members || []);
    } catch (error) {
      console.error("Error fetching group details:", error);
      if (error.response?.status === 403) {
        showToast("You don't have access to this group", "error");
      } else if (error.response?.status === 404) {
        showToast("Group not found", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserItineraries = async () => {
    try {
      const response = await api.get("/itineraries");
      const available = response.data.filter(
        (it) => !it.is_group || it.group_id !== parseInt(id)
      );
      setUserItineraries(available);
    } catch (error) {
      console.error("Error fetching user itineraries:", error);
    }
  };

  const handleCreateItinerary = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${id}/itinerary`, newItinerary);
      setShowCreateItineraryModal(false);
      setNewItinerary({
        destination: "",
        start_date: "",
        end_date: "",
        budget: "",
        preferences: "",
      });
      fetchGroupDetails();
      showToast("Itinerary created successfully!", "success");
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Failed to create itinerary",
        "error"
      );
    }
  };

  const handleAddExistingItinerary = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${id}/add-itinerary/${selectedItineraryId}`);
      setShowAddItineraryModal(false);
      setSelectedItineraryId("");
      fetchGroupDetails();
      fetchUserItineraries();
      showToast("Itinerary added to group successfully!", "success");
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Failed to add itinerary",
        "error"
      );
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${id}/invite`, { user_email: inviteUsername });
      setShowInviteModal(false);
      setInviteUsername("");
      fetchGroupDetails();
      showToast("Member invited successfully!", "success");
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Failed to invite member",
        "error"
      );
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await api.delete(`/groups/${id}/members/${userId}`);
      fetchGroupDetails();
      showToast("Member removed successfully", "success");
    } catch (error) {
      showToast("Failed to remove member", "error");
    }
  };

  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-20 right-4 z-50 px-5 py-3 rounded-lg border text-sm bg-[#1a1a1a] border-gray-700 text-gray-200`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 4000);
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

  const memberColors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-green-500 to-green-600",
    "from-orange-500 to-orange-600",
    "from-cyan-500 to-cyan-600",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Group Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-8 mb-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-gray-700 rounded-2xl flex items-center justify-center"
              >
                <Users className="w-8 h-8 text-gray-300" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100 mb-2">
                  {group?.name}
                </h1>
                <p className="text-sm text-gray-500 mb-3">
                  {group?.description || "No description provided"}
                </p>
                <div className="flex items-center gap-4">
                  <span className="flex items-center text-gray-400 text-xs">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    {members.length} {members.length === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {(group?.user_role === "admin" || group?.user_role === "creator") && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Invite
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6"
        >
          <h2 className="text-base font-semibold text-gray-200 mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map((member, index) => (
              <motion.div
                key={member.user_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-[#252525] p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={`w-11 h-11 bg-gradient-to-br ${
                        memberColors[index % memberColors.length]
                      } rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg`}
                    >
                      {member.username.charAt(0).toUpperCase()}
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-gray-200 text-sm">
                          {member.username}
                        </p>
                        {(member.role === "admin" || member.role === "creator") && (
                          <Crown className="w-3.5 h-3.5 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  {group?.user_role === "creator" && member.role !== "creator" && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Itineraries Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              Shared Itineraries
            </h2>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateItineraryModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create New
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddItineraryModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:border-gray-600 hover:bg-gray-800/30 transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                Add Existing
              </motion.button>
            </div>
          </div>

          {group?.itineraries && group.itineraries.length > 0 ? (
            <div className="space-y-3">
              {group.itineraries.map((itinerary, index) => (
                <motion.div
                  key={itinerary.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  onClick={() => navigate(`/itinerary/${itinerary.id}`)}
                  className="group bg-[#252525] p-4 rounded-lg border border-gray-800 hover:border-gray-700 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-200 text-sm mb-2 flex items-center justify-between">
                        {itinerary.title || itinerary.destination}
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                      </h3>
                      <p className="text-xs text-gray-400 mb-2">
                        {itinerary.destination}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        {itinerary.start_date && itinerary.end_date && (
                          <span className="flex items-center text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(itinerary.start_date).toLocaleDateString()} -{" "}
                            {new Date(itinerary.end_date).toLocaleDateString()}
                          </span>
                        )}
                        {itinerary.budget && (
                          <span className="flex items-center text-gray-500">
                            ₹{itinerary.budget}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700"
              >
                <MapPin className="w-7 h-7 text-gray-600" />
              </motion.div>
              <p className="text-sm text-gray-400 mb-1">No itineraries yet</p>
              <p className="text-xs text-gray-600">
                Create or add an itinerary to get started!
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            onClick={() => {
              setShowInviteModal(false);
              setInviteUsername("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] rounded-lg p-8 w-full max-w-md border border-gray-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-100">Invite Member</h2>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteUsername("");
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                    placeholder="Enter username to invite"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteUsername("");
                    }}
                    className="px-5 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-6 py-2.5 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Send Invite
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Itinerary Modal */}
      <AnimatePresence>
        {showCreateItineraryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            onClick={() => {
              setShowCreateItineraryModal(false);
              setNewItinerary({
                destination: "",
                start_date: "",
                end_date: "",
                budget: "",
                preferences: "",
              });
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] rounded-lg p-8 w-full max-w-2xl border border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-100">
                  Create Group Itinerary
                </h2>
                <button
                  onClick={() => {
                    setShowCreateItineraryModal(false);
                    setNewItinerary({
                      destination: "",
                      start_date: "",
                      end_date: "",
                      budget: "",
                      preferences: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateItinerary} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    required
                    value={newItinerary.destination}
                    onChange={(e) =>
                      setNewItinerary({ ...newItinerary, destination: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                    placeholder="Paris, France"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newItinerary.start_date}
                      onChange={(e) =>
                        setNewItinerary({ ...newItinerary, start_date: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newItinerary.end_date}
                      onChange={(e) =>
                        setNewItinerary({ ...newItinerary, end_date: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Budget (Optional)
                  </label>
                  <input
                    type="number"
                    value={newItinerary.budget}
                    onChange={(e) =>
                      setNewItinerary({ ...newItinerary, budget: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                    placeholder="Enter budget amount"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferences (Optional)
                  </label>
                  <textarea
                    value={newItinerary.preferences}
                    onChange={(e) =>
                      setNewItinerary({ ...newItinerary, preferences: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors text-sm h-24 resize-none"
                    placeholder="Museums, local food, outdoor activities..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateItineraryModal(false);
                      setNewItinerary({
                        destination: "",
                        start_date: "",
                        end_date: "",
                        budget: "",
                        preferences: "",
                      });
                    }}
                    className="px-5 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-6 py-2.5 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Create Itinerary
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Existing Itinerary Modal */}
      <AnimatePresence>
        {showAddItineraryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            onClick={() => {
              setShowAddItineraryModal(false);
              setSelectedItineraryId("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] rounded-lg p-8 w-full max-w-2xl border border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-100">
                  Add Existing Itinerary
                </h2>
                <button
                  onClick={() => {
                    setShowAddItineraryModal(false);
                    setSelectedItineraryId("");
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExistingItinerary} className="space-y-4">
                {userItineraries.length > 0 ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Select an itinerary to share with the group
                      </label>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {userItineraries.map((itinerary) => (
                          <label
                            key={itinerary.id}
                            className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedItineraryId === itinerary.id.toString()
                                ? "border-gray-600 bg-gray-800/50"
                                : "border-gray-800 bg-[#252525] hover:border-gray-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name="itinerary"
                              value={itinerary.id}
                              checked={selectedItineraryId === itinerary.id.toString()}
                              onChange={(e) => setSelectedItineraryId(e.target.value)}
                              className="mt-1 mr-3"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-200 text-sm mb-1">
                                {itinerary.title || itinerary.destination}
                              </h3>
                              <p className="text-xs text-gray-400 mb-2">
                                {itinerary.destination}
                              </p>
                              <div className="flex items-center gap-4 text-xs">
                                {itinerary.start_date && (
                                  <span className="flex items-center text-gray-500">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(itinerary.start_date).toLocaleDateString()}
                                  </span>
                                )}
                                {itinerary.budget && (
                                  <span className="text-gray-500">
                                    ₹{itinerary.budget}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddItineraryModal(false);
                          setSelectedItineraryId("");
                        }}
                        className="px-5 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!selectedItineraryId}
                        className={`px-6 py-2.5 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all ${
                          !selectedItineraryId ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Add to Group
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                      <FolderPlus className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-400 mb-1">No available itineraries</p>
                    <p className="text-xs text-gray-600">
                      Create a personal itinerary first to share it with the group
                    </p>
                  </motion.div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
