import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { api } from "../services/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
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
      // Optionally redirect to group page
      // window.location.href = `/groups/${groupId}`;
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || "Failed to accept invitation";
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

  const formatTimeAgo = (dateString) => {
    // Parse the UTC timestamp and convert to local time
    const date = new Date(dateString + (dateString.includes("Z") ? "" : "Z"));
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 0) return "just now"; // Handle future times (clock skew)
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-500">
                {unreadCount} unread
              </span>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition ${
                    !notification.read_at ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {notification.message}
                  </p>

                  {notification.type === "group_invite" &&
                    notification.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleAccept(notification.id, notification.group_id)
                          }
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(notification.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}

                  {notification.status === "accepted" && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Accepted
                    </span>
                  )}

                  {notification.status === "rejected" && (
                    <span className="text-xs text-red-600 font-medium">
                      ✗ Rejected
                    </span>
                  )}

                  {!notification.read_at &&
                    notification.status !== "pending" && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        Mark as read
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
