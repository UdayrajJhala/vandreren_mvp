import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Travel Planning
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              Plan Your Perfect
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Indian Adventure
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Experience intelligent travel planning with AI-powered
              itineraries, real-time optimization, and group collaboration—all
              in Indian Rupees.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                to="/auth"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Start Planning Free
              </Link>
              <Link
                to="/auth"
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-full border-2 border-gray-200 hover:border-blue-600 hover:shadow-lg transition-all duration-200"
              >
                View Demo
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-gray-600">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Free forever plan
              </div>
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Unlimited itineraries
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Perfect Travel
            </h2>
            <p className="text-xl text-gray-600">
              Powered by advanced AI to make your travel planning effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                AI-Powered Planning
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get personalized itineraries generated by advanced AI that
                learns your preferences and creates perfect travel plans in
                seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Route Optimization
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Smart algorithms optimize your travel routes to save time and
                money, ensuring you visit more places efficiently.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Group Travel
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Plan trips with friends and family. Collaborate on itineraries,
                split expenses, and keep everyone in sync.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Interactive Maps
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Visualize your journey with interactive maps showing all
                destinations, routes, and points of interest.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Progress Tracking
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track your journey in real-time. Mark completed activities and
                see your progress throughout your trip.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Budget Management
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All costs in Indian Rupees. Track expenses, set budgets, and get
                cost-effective recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to your perfect journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Tell Us Your Dreams
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Share your destination, dates, budget, and preferences. Our AI
                understands what makes your perfect trip.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                AI Creates Magic
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Watch as our AI generates a personalized itinerary with
                optimized routes, activities, and costs in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Travel & Track
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Use your itinerary on the go, track progress, update plans, and
                collaborate with your travel companions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Travelers
            </h2>
            <p className="text-xl text-gray-600">
              See what our users are saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                "Vandreren made planning our Rajasthan trip so easy! The AI
                understood exactly what we wanted and gave us the perfect
                itinerary."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  P
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Priya Sharma</p>
                  <p className="text-sm text-gray-600">Mumbai</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                "The group travel feature is amazing! We planned our friends'
                trip to Goa and everyone could contribute. The budget tracking
                in ₹ is perfect."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  R
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Rahul Verma</p>
                  <p className="text-sm text-gray-600">Delhi</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                "Route optimization saved us hours during our Kerala trip. The
                AI planned everything perfectly considering travel time between
                places."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  A
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Anjali Reddy</p>
                  <p className="text-sm text-gray-600">Bangalore</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of travelers planning their perfect trips with AI
          </p>
          <Link
            to="/auth"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">Vandreren</h3>
              <p className="text-sm">
                AI-powered travel planning made simple, affordable, and
                personalized for Indian travelers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/dashboard" className="hover:text-white transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-white transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-white transition">
                    How it works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>
              &copy; 2025 Vandreren. All rights reserved. Made with ❤️ for
              Indian travelers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
