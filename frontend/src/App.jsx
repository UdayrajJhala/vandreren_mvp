import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ItineraryPage from "./pages/ItineraryPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import { AuthProvider, useAuth } from "./context/AuthContext";

function AppContent() {
  const location = useLocation();
  const showHeader = location.pathname !== "/";

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      <main className={showHeader ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/itinerary/:id"
            element={
              <PrivateRoute>
                <ItineraryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:id?"
            element={
              <PrivateRoute>
                <ChatPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <PrivateRoute>
                <GroupsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <PrivateRoute>
                <GroupDetailPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default App;
