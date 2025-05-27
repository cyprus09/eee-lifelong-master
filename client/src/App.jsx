import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import HomePage from "./pages/common/HomePage";
import LoginPage from "./pages/common/LoginPage";
import RegisterPage from "./pages/common/RegisterPage";
import ProfilePage from "./pages/common/ProfilePage";
import EventsPage from "./pages/student/EventsPage";
import NotFoundPage from "./pages/common/NotFoundPage";
import { Toaster } from "./components/ui/sonner";
import StudentLeaderDashboard from "./pages/leader/StudentLeaderDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { Analytics } from "@vercel/analytics/next"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/home"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route path="/" element={<Navigate to="/home" />} />
          <Route
            path="/profile"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/events"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/leader/dashboard"
            element={
              <ErrorBoundary>
                <ProtectedRoute requiredRole="student_leader">
                  <StudentLeaderDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin"
            element={
              <ErrorBoundary>
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
          <Toaster />
          <Analytics/>
      </AuthProvider>
    </BrowserRouter>
  );
}
