import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'));
const CreateReportPage = lazy(() => import('./pages/citizen/CreateReportPage'));
const MyReportsPage = lazy(() => import('./pages/citizen/MyReportsPage'));
const ReportDetailPage = lazy(() => import('./pages/citizen/ReportDetailPage'));
const VerifierQueuePage = lazy(() => import('./pages/verifier/VerifierQueuePage'));
const VerifierReportDetailPage = lazy(() => import('./pages/verifier/VerifierReportDetailPage'));
const AssignedReportsPage = lazy(() => import('./pages/officer/AssignedReportsPage'));
const OfficerReportDetailPage = lazy(() => import('./pages/officer/OfficerReportDetailPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>
  );
}

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoadingFallback />;
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
          <Suspense fallback={<PageLoadingFallback />}>
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
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
