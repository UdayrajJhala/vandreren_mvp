import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Calendar, X, Loader, ArrowRight } from "lucide-react";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get("/groups");
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post("/groups", createForm);
      setShowCreateModal(false);
      setCreateForm({ name: "", description: "" });
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
    }
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

  const groupColors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-green-500 to-green-600",
    "from-orange-500 to-orange-600",
    "from-cyan-500 to-cyan-600",
    "from-indigo-500 to-indigo-600",
    "from-teal-500 to-teal-600",
  ];

  const roleColors = {
    creator: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    member: "bg-gray-700 text-gray-400 border-gray-600",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-1">
              Travel Groups
            </h1>
            <p className="text-sm text-gray-500">
              Plan trips with friends and family
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </motion.button>
        </motion.div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] text-center py-20 rounded-xl border border-gray-800"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700"
            >
              <Users className="w-9 h-9 text-gray-600" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              No Groups Yet
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Create your first group and start planning adventures together!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Group
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Link
                  to={`/groups/${group.id}`}
                  className="group bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-gray-700 transition-all block overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className={`w-14 h-14 bg-gradient-to-br ${
                          groupColors[index % groupColors.length]
                        } rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        <Users className="w-7 h-7 text-white" />
                      </motion.div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border capitalize ${
                          roleColors[group.user_role] || roleColors.member
                        }`}
                      >
                        {group.user_role}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-200 mb-2 flex items-center justify-between">
                      {group.name}
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {group.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        {group.members_count}{" "}
                        {group.members_count === 1 ? "member" : "members"}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(group.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            onClick={() => {
              setShowCreateModal(false);
              setCreateForm({ name: "", description: "" });
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
                <h2 className="text-lg font-semibold text-gray-100">
                  Create New Group
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ name: "", description: "" });
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                    placeholder="Family Goa Trip"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors text-sm resize-none"
                    placeholder="Brief description of the group"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateForm({ name: "", description: "" });
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
                    Create Group
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
