import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    full_name: "",
    interests: "",
    travel_style: "balanced",
    dietary_restrictions: "",
    budget_preference: "mid-range",
    accommodation_type: "hotel",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let result;
    if (isLogin) {
      result = await login({
        username: formData.username,
        password: formData.password,
      });
    } else {
      const preferences = {
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

      result = await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        preferences,
      });
    }

    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
            <span className="text-2xl">✈️</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Join Vandreren"}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin ? "Sign in to continue your travel planning" : "Create your account to start planning"}
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8 animate-slide-up">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📧 Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👤 Full Name
                    </label>
                    <input
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Enter your full name"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ Username
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔒 Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your password"
                />
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Travel Interests
                    </label>
                    <input
                      name="interests"
                      type="text"
                      value={formData.interests}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="museums, food, nature, adventure..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏃 Travel Style
                    </label>
                    <select
                      name="travel_style"
                      value={formData.travel_style}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="relaxed">🌴 Relaxed - Take it easy</option>
                      <option value="balanced">⚖️ Balanced - Mix of activities</option>
                      <option value="packed">🚀 Packed - Adventure filled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🍽️ Dietary Restrictions
                    </label>
                    <input
                      name="dietary_restrictions"
                      type="text"
                      value={formData.dietary_restrictions}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="vegetarian, gluten-free, allergies..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💰 Budget Preference
                    </label>
                    <select
                      name="budget_preference"
                      value={formData.budget_preference}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="budget">💵 Budget - Cost conscious</option>
                      <option value="mid-range">💳 Mid-range - Comfortable</option>
                      <option value="luxury">💎 Luxury - Premium experience</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏨 Accommodation Type
                    </label>
                    <select
                      name="accommodation_type"
                      value={formData.accommodation_type}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="hotel">🏨 Hotel</option>
                      <option value="hostel">🏠 Hostel</option>
                      <option value="airbnb">🏡 Airbnb</option>
                      <option value="resort">🏖️ Resort</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Please wait...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {isLogin ? "🚀 Sign In" : "🎉 Create Account"}
                </div>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
