import React, { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './context/AuthContext';
import PageLoader from './components/PageLoader';
import { useTokenRefresh } from './hooks/useTokenRefresh';

// Lazy load pages for better performance
const Welcome = lazy(() => import('./pages/Welcome'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Account = lazy(() => import('./pages/Account'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Finances = lazy(() => import('./pages/Finances'));

export default function App() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(true);

  // Enable proactive token refresh
  useTokenRefresh();

  // Route-change loader: show immediately on navigation (and initial mount), hide after a short delay.
   
  useEffect(() => {
    const timeoutId = setTimeout(() => setRouteLoading(false), 450);
    setRouteLoading(true);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only p-2 z-50 fixed top-2 left-2 bg-black/60 text-white rounded"
      >
        Skip to content
      </a>
      <Navbar />
      <PageLoader active={routeLoading} />

      <main
        id="main"
        className={`transition-opacity duration-200 ${
          routeLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
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
              path="/finances"
              element={
                <ProtectedRoute>
                  <Finances />
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
      </main>
    </>
  );
}
