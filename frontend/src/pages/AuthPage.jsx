import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { X } from "lucide-react";

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

  const features = [
    {
      title: "Intelligent Recommendations",
      description:
        "Get personalized suggestions based on your travel style and interests",
    },
    {
      title: "Seamless Planning",
      description:
        "From destination research to day-by-day itineraries in minutes",
    },
    {
      title: "Budget Aware",
      description:
        "Plans that respect your budget without compromising experience",
    },
    {
      title: "Real-time Updates",
      description:
        "Track itinerary generation progress and make adjustments on the fly",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-40 -left-40 w-80 h-80 bg-gray-700/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-gray-600/5 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-6xl w-full flex gap-12 relative z-10">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex flex-col justify-center flex-1 pr-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <h1 className="text-5xl font-semibold text-gray-100 mb-4">
              Vandreren
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              AI-powered travel planning that understands you. Create perfect
              itineraries tailored to your preferences.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors"
              >
                <h3 className="text-gray-200 font-medium mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 max-w-md w-full bg-[#1a1a1a] backdrop-blur-xl rounded-lg shadow-2xl border border-gray-800 p-8"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-100 mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-gray-400">
              {isLogin
                ? "Sign in to continue your journey"
                : "Start planning your next adventure"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-all"
                    placeholder="you@example.com"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  <input
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-all"
                    placeholder="John Doe"
                  />
                </motion.div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-all"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Interests
                  </label>
                  <input
                    name="interests"
                    type="text"
                    value={formData.interests}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-all"
                    placeholder="museums, food, nature"
                  />
                  <p className="text-xs text-gray-600 mt-1.5">
                    Comma-separated
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Travel Style
                    </label>
                    <select
                      name="travel_style"
                      value={formData.travel_style}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-all"
                    >
                      <option value="relaxed">Relaxed</option>
                      <option value="balanced">Balanced</option>
                      <option value="packed">Packed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Budget
                    </label>
                    <select
                      name="budget_preference"
                      value={formData.budget_preference}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-all"
                    >
                      <option value="budget">Budget</option>
                      <option value="mid-range">Mid-range</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Dietary Restrictions
                  </label>
                  <input
                    name="dietary_restrictions"
                    type="text"
                    value={formData.dietary_restrictions}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-all"
                    placeholder="vegetarian, gluten-free"
                  />
                  <p className="text-xs text-gray-600 mt-1.5">Optional</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Accommodation Type
                  </label>
                  <select
                    name="accommodation_type"
                    value={formData.accommodation_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-gray-500 transition-all"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="hostel">Hostel</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="resort">Resort</option>
                  </select>
                </div>
              </>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gray-700 text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50 font-medium shadow-lg transition-all duration-300 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                  Please wait...
                </span>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </motion.button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
