import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

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
import NotFoundPage from './pages/NotFoundPage';

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
            <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<CitizenDashboard />} />
                <Route path="/reports/create" element={<CreateReportPage />} />
                <Route path="/reports/me" element={<MyReportsPage />} />
                <Route path="/reports/:id" element={<ReportDetailPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['VERIFIER', 'ADMIN']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/verifier" element={<VerifierQueuePage />} />
                <Route path="/verifier/reports/:id" element={<VerifierReportDetailPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['OFFICER']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/officer" element={<AssignedReportsPage />} />
                <Route path="/officer/reports/:id" element={<OfficerReportDetailPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* Fallback 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
