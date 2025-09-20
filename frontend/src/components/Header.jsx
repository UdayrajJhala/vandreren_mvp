import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const isActiveRoute = (path) => location.pathname === path;

  if (!user) {
    return (
      <header className="fixed top-0 left-0 right-0 glass-effect z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ✈️ Vandreren
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 glass-effect z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
            ✈️ Vandreren
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/dashboard" 
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActiveRoute('/dashboard') 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              🏠 Dashboard
            </Link>
            <Link 
              to="/chat" 
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActiveRoute('/chat') 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              💬 Chat
            </Link>
            <Link 
              to="/profile" 
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActiveRoute('/profile') 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              👤 Profile
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 font-medium">Welcome, {user.username}</span>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop logout button */}
            <button
              onClick={handleLogout}
              className="hidden md:block bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-3 space-y-2">
              <Link 
                to="/dashboard" 
                onClick={() => setShowMobileMenu(false)}
                className={`block px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActiveRoute('/dashboard') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                🏠 Dashboard
              </Link>
              <Link 
                to="/chat" 
                onClick={() => setShowMobileMenu(false)}
                className={`block px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActiveRoute('/chat') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                💬 Chat
              </Link>
              <Link 
                to="/profile" 
                onClick={() => setShowMobileMenu(false)}
                className={`block px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActiveRoute('/profile') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                👤 Profile
              </Link>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 font-medium">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
