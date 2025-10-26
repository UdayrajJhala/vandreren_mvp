import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import CreateItineraryModal from "../components/CreateItineraryModal";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Loader,
  Plus,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Dashboard() {
  const [itineraries, setItineraries] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itinerariesRes, conversationsRes] = await Promise.all([
        api.get("/itineraries"),
        api.get("/conversations"),
      ]);
      setItineraries(itinerariesRes.data);
      setConversations(conversationsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItineraryCreated = () => {
    setShowCreateModal(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Loader className="w-8 h-8 text-gray-500" />
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gray-700 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.05, 0.03, 0.05],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gray-600 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6 py-8 relative z-10"
      >
        {/* Header with animation */}
        <motion.div variants={itemVariants} className="mb-10">
          <motion.h1
            className="text-3xl font-bold text-gray-100 mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Welcome back,{" "}
            <motion.span
              className="inline-block bg-gradient-to-r from-gray-400 to-gray-200 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              Explorer
            </motion.span>
          </motion.h1>
          <motion.p
            className="text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Your next adventure awaits
          </motion.p>
        </motion.div>

        {/* Quick Actions with enhanced animations */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="group bg-gradient-to-br from-[#1a1a1a] to-[#252525] p-8 rounded-xl border border-gray-800 hover:border-gray-700 transition-all text-left relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={false}
            />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                    className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:border-gray-600 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-gray-400" />
                  </motion.div>
                </div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">
                  Create New Itinerary
                </h3>
                <p className="text-sm text-gray-500">
                  Plan your next adventure with AI assistance
                </p>
              </div>
              <motion.div
                className="text-gray-600 group-hover:text-gray-400"
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </div>
          </motion.button>

          <motion.div whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/chat"
              className="group bg-gradient-to-br from-[#1a1a1a] to-[#252525] p-8 rounded-xl border border-gray-800 hover:border-gray-700 transition-all block relative overflow-hidden h-full"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:border-gray-600 transition-colors"
                    >
                      <MessageSquare className="w-6 h-6 text-gray-400" />
                    </motion.div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">
                    Chat with AI
                  </h3>
                  <p className="text-sm text-gray-500">
                    Get instant travel recommendations
                  </p>
                </div>
                <motion.div
                  className="text-gray-600 group-hover:text-gray-400"
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats with staggered animations */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          {[
            {
              icon: MapPin,
              label: "Itineraries",
              value: itineraries.length,
              gradient: "from-gray-700 to-gray-600",
            },
            {
              icon: MessageSquare,
              label: "Conversations",
              value: conversations.length,
              gradient: "from-gray-600 to-gray-700",
            },
            {
              icon: TrendingUp,
              label: "Active Plans",
              value: itineraries.filter((i) => new Date(i.end_date) > new Date())
                .length,
              gradient: "from-gray-700 to-gray-600",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ duration: 0.2 }}
              className="group bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all relative overflow-hidden"
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                initial={false}
              />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-2">{stat.label}</p>
                  <motion.p
                    className="text-3xl font-bold text-gray-200"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="p-3 rounded-lg bg-gray-800 border border-gray-700"
                >
                  <stat.icon className="w-5 h-5 text-gray-400" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content Grid with animations */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Itineraries */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                Your Itineraries
              </h2>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-gray-600" />
              </motion.div>
            </div>
            <div className="space-y-3">
              {itineraries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-[#1a1a1a] text-center py-16 rounded-xl border border-gray-800 relative overflow-hidden group"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.15, 0.1],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-gray-700 to-transparent"
                  />
                  <div className="relative">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700"
                    >
                      <MapPin className="w-7 h-7 text-gray-600" />
                    </motion.div>
                    <p className="text-sm text-gray-400 mb-4">
                      No itineraries yet
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-2.5 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create your first one
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                itineraries.map((itinerary, index) => (
                  <motion.div
                    key={itinerary.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                  >
                    <Link
                      to={`/itinerary/${itinerary.id}`}
                      className="group bg-[#1a1a1a] block p-5 rounded-xl border border-gray-800 hover:border-gray-700 transition-all relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                      />
                      <div className="relative">
                        <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center justify-between">
                          {itinerary.title}
                          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-600" />
                          <p className="text-xs text-gray-400">
                            {itinerary.destination}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-600" />
                          <p className="text-xs text-gray-400">
                            {itinerary.start_date} to {itinerary.end_date}
                          </p>
                        </div>
                        {itinerary.budget && (
                          <div className="mt-3 pt-3 border-t border-gray-800">
                            <p className="text-xs font-medium text-gray-500">
                              Budget: ₹{itinerary.budget.toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Conversations */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                Recent Conversations
              </h2>
            </div>
            <div className="space-y-3">
              {conversations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-[#1a1a1a] text-center py-16 rounded-xl border border-gray-800 relative overflow-hidden"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.15, 0.1],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-gray-600 to-transparent"
                  />
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700"
                    >
                      <MessageSquare className="w-7 h-7 text-gray-600" />
                    </motion.div>
                    <p className="text-sm text-gray-400 mb-4">
                      No conversations yet
                    </p>
                    <Link to="/chat">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2.5 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all inline-flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Start chatting
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                conversations.slice(0, 5).map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                  >
                    <Link
                      to={`/chat/${conversation.id}`}
                      className="group bg-[#1a1a1a] block p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-all relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                      />
                      <div className="relative">
                        <h3 className="text-sm font-medium text-gray-200 mb-1 flex items-center justify-between">
                          {conversation.title}
                          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                        </h3>
                        <p className="text-xs text-gray-500">
                          Updated:{" "}
                          {new Date(
                            conversation.updated_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {showCreateModal && (
        <CreateItineraryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleItineraryCreated}
        />
      )}
    </div>
  );
}
