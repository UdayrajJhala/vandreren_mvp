import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, X, Clock } from "lucide-react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell({ darkMode = true }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleAccept = async (notificationId, groupId) => {
    try {
      await api.post(`/notifications/${notificationId}/accept`);
      showToast("Group invitation accepted!", "success");
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to accept invitation";
      showToast(errorMsg, "error");
    }
  };

  const handleReject = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/reject`);
      showToast("Group invitation rejected", "info");
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      showToast("Failed to reject invitation", "error");
    }
  };

  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-20 right-4 z-50 px-5 py-3 rounded-lg border text-sm ${
      type === "success"
        ? "bg-[#1a1a1a] border-gray-700 text-gray-200"
        : type === "error"
        ? "bg-[#1a1a1a] border-gray-700 text-gray-200"
        : "bg-[#1a1a1a] border-gray-700 text-gray-200"
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString + (dateString.includes("Z") ? "" : "Z"));
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 0) return "just now";
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleBellClick}
        className="relative p-2 text-gray-400 hover:text-gray-200 transition rounded-md hover:bg-gray-800/50"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 bg-gray-700 text-gray-200 text-xs font-medium rounded-full w-4 h-4 flex items-center justify-center border border-gray-600"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-[#1a1a1a] backdrop-blur-xl rounded-lg shadow-2xl border border-gray-800 z-50 max-h-[500px] overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-200">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-medium rounded">
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[420px] custom-scrollbar">
              {loading ? (
                <div className="px-5 py-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <Bell className="w-6 h-6 text-gray-500" />
                  </motion.div>
                  <p className="text-gray-500 mt-4 text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-gray-300 font-medium text-sm mb-1">All caught up!</p>
                  <p className="text-xs text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`px-5 py-4 hover:bg-gray-800/30 transition ${
                        !notification.read_at ? "bg-gray-800/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-3">
                          <h4 className="font-medium text-gray-200 text-sm mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center text-xs text-gray-600 whitespace-nowrap">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(notification.created_at)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {notification.type === "group_invite" && notification.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAccept(notification.id, notification.group_id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 text-xs font-medium rounded-md hover:bg-gray-600 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleReject(notification.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-700 text-gray-400 text-xs font-medium rounded-md hover:border-gray-600 hover:text-gray-300 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </motion.button>
                        </div>
                      )}

                      {/* Status Badges */}
                      {notification.status === "accepted" && (
                        <div className="mt-3 px-2 py-1 bg-gray-700/50 text-gray-400 text-xs font-medium rounded inline-flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          Accepted
                        </div>
                      )}

                      {notification.status === "rejected" && (
                        <div className="mt-3 px-2 py-1 bg-gray-700/50 text-gray-400 text-xs font-medium rounded inline-flex items-center">
                          <X className="w-3 h-3 mr-1" />
                          Rejected
                        </div>
                      )}

                      {!notification.read_at && notification.status !== "pending" && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-gray-500 hover:text-gray-400 font-medium mt-2 transition"
                        >
                          Mark as read
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }
      `}</style>
    </div>
  );
}
