import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/chat", label: "Chat" },
    { path: "/groups", label: "Groups" },
    { path: "/profile", label: "Profile" },
  ];

  if (!user) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-14">
            <Link to="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-lg font-semibold text-gray-100"
              >
                Vandreren
              </motion.div>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link to="/dashboard">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-lg font-semibold text-gray-100"
              >
                Vandreren
              </motion.div>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                location.pathname.startsWith(link.path + "/");
              return (
                <Link key={link.path} to={link.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gray-700 text-gray-100"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {link.label}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Right: User Actions */}
          <div className="flex items-center gap-4">
            <NotificationBell darkMode={darkMode} />

            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-800">
              <span className="text-xs text-gray-500">{user.username}</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 border border-gray-700 rounded-md hover:border-gray-600 transition-all"
              >
                Logout
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-gray-800"
          >
            <div className="px-6 py-3 space-y-1">
              {navLinks.map((link) => {
                const isActive =
                  location.pathname === link.path ||
                  location.pathname.startsWith(link.path + "/");
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gray-700 text-gray-100"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {link.label}
                    </div>
                  </Link>
                );
              })}
              <div className="pt-2 mt-2 border-t border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 border border-gray-700 rounded-md hover:border-gray-600 transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
