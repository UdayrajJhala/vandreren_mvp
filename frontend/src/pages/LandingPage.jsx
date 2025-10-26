import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  MessageCircle,
  Users,
  Shield,
  Zap,
  Check,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(true);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Powered Itineraries",
      description: "Get personalized travel plans generated in seconds",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Global Destinations",
      description: "Explore destinations worldwide with local insights",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Group Travel Planning",
      description: "Collaborate with friends on shared itineraries",
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Smart Travel Assistant",
      description: "Chat with AI for instant recommendations",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your travel data is encrypted and private",
    },
    {
      icon: <Check className="w-6 h-6" />,
      title: "Progress Tracking",
      description: "Track your journey and completed activities",
    },
  ];

  const pricing = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      features: [
        "3 AI itineraries/month",
        "Basic chat support",
        "Progress tracking",
        "Mobile responsive",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "₹499",
      period: "per month",
      features: [
        "Unlimited itineraries",
        "Priority AI support",
        "Group collaboration",
        "Advanced customization",
        "Export to PDF",
        "24/7 support",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      features: [
        "Everything in Pro",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantees",
        "Training & onboarding",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gray-700 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.03, 0.05],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gray-600 rounded-full blur-3xl"
        />
      </div>

      {/* Navigation */}
      <nav className="bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <span className="text-lg font-semibold text-gray-100">
                Vandreren
              </span>
            </motion.div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-gray-700 text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6 px-4 py-1.5 bg-gray-800 border border-gray-700 rounded-full"
          >
            <span className="text-gray-300 text-sm font-medium">
              AI-Powered Travel Planning
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-100 mb-6 leading-tight">
            Your Journey,
            <br />
            <span className="text-gray-300">Perfectly Planned</span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create personalized travel itineraries in seconds with our
            AI-powered platform. From solo adventures to group trips, we've got
            you covered.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gray-700 text-gray-200 font-medium rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-[#1a1a1a] border border-gray-800 text-gray-300 font-medium rounded-lg hover:border-gray-700 transition-all"
            >
              Watch Demo
            </motion.button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto"
          >
            {[
              { value: "50K+", label: "Itineraries Created" },
              { value: "150+", label: "Countries Covered" },
              { value: "4.9/5", label: "User Rating" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4 }}
                className="bg-[#1a1a1a] border border-gray-800 p-5 rounded-lg"
              >
                <div className="text-2xl font-bold text-gray-200">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-100 mb-3">
            Everything You Need to Plan the Perfect Trip
          </h2>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to make travel planning effortless
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-lg hover:border-gray-700 transition-all"
            >
              <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-gray-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-200 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-100 mb-3">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">
            Choose the plan that's right for you
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricing.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={`bg-[#1a1a1a] border p-8 rounded-lg relative ${
                plan.popular ? "border-gray-600" : "border-gray-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-xs font-medium border border-gray-600">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-200 mb-3">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-100">
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    /{plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-sm">
                    <Check className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    plan.popular
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      : "bg-[#252525] border border-gray-800 text-gray-300 hover:border-gray-700"
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] border border-gray-800 rounded-xl p-12 text-center relative overflow-hidden"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
            }}
            className="absolute inset-0 bg-gray-700 rounded-full blur-3xl"
          />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">
              Ready to Start Your Adventure?
            </h2>
            <p className="text-base text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who trust Vandreren for their journey
              planning
            </p>
            <Link to="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gray-700 text-gray-200 font-medium rounded-lg hover:bg-gray-600 transition-all inline-flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] border-t border-gray-800 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-100 mb-2">
              Vandreren
            </div>
            <p className="text-sm text-gray-500 mb-3">
              AI-Powered Travel Planning Platform
            </p>
            <p className="text-xs text-gray-600">
              © 2025 Vandreren. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
