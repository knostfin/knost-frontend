import React, { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './context/AuthContext';
import PageLoader from './components/PageLoader';
import { useTokenRefresh } from './hooks/useTokenRefresh';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for better performance
const Welcome = lazy(() => import('./pages/Welcome'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FinancialAnalytics = lazy(() => import('./pages/FinancialAnalytics'));
const Account = lazy(() => import('./pages/Account'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

export default function App() {
  const { user } = useContext(AuthContext);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);

  // Enable proactive token refresh
  useTokenRefresh();

  // Listen for SW update availability events dispatched from registration
  useEffect(() => {
    const handleUpdate = () => setSwUpdateAvailable(true);
    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const handleRefresh = () => {
    navigator.serviceWorker?.getRegistration?.().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-transparent relative">
      <a
        href="#main"
        className="sr-only focus:not-sr-only p-2 z-50 fixed top-2 left-2 bg-black/60 text-white rounded"
      >
        Skip to content
      </a>
      <Navbar />

      <main id="main" className="flex-1 w-full relative z-10">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader active />}>
            <Routes>
              {/* If logged in → redirect / to dashboard */}
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Welcome />} />

              {/* If logged in → redirect login/signup */}
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
              
              {/* Reset Password (public) */}
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Dashboard protected */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <FinancialAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* Account details (protected) */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />

              {/* Unknown routes */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {swUpdateAvailable && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10100] flex items-center gap-3 rounded-full bg-black/80 text-white px-4 py-2 shadow-lg border border-white/10 backdrop-blur">
          <span className="text-sm">New version available.</span>
          <button
            onClick={handleRefresh}
            className="text-sm font-semibold px-3 py-1 rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
