import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import CreateReportPage from './pages/citizen/CreateReportPage';
import MyReportsPage from './pages/citizen/MyReportsPage';
import ReportDetailPage from './pages/citizen/ReportDetailPage';
import VerifierQueuePage from './pages/verifier/VerifierQueuePage';
import VerifierReportDetailPage from './pages/verifier/VerifierReportDetailPage';
import AssignedReportsPage from './pages/officer/AssignedReportsPage';
import OfficerReportDetailPage from './pages/officer/OfficerReportDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';

import LandingPage from './pages/LandingPage';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  switch (user?.role) {
    case 'VERIFIER':
      return <Navigate to="/verifier" replace />;
    case 'OFFICER':
      return <Navigate to="/officer" replace />;
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'CITIZEN':
    default:
      return <Navigate to="/dashboard" replace />;
  }
}

import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes by Role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/create"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CreateReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/me"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <MyReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <ReportDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifier"
            element={
              <ProtectedRoute allowedRoles={['VERIFIER', 'ADMIN']}>
                <VerifierQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifier/reports/:id"
            element={
              <ProtectedRoute allowedRoles={['VERIFIER', 'ADMIN']}>
                <VerifierReportDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={['OFFICER']}>
                <AssignedReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/reports/:id"
            element={
              <ProtectedRoute allowedRoles={['OFFICER']}>
                <OfficerReportDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
  );
}
