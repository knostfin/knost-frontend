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
const FinancialAnalytics = lazy(() => import('./pages/FinancialAnalytics'));
const Account = lazy(() => import('./pages/Account'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

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
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-[#020617] relative">
      {/* Mesh gradient background - matches index.css body style */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px]"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px]"></div>
      </div>
      
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
        className={`flex-1 w-full transition-opacity duration-200 relative z-10 ${
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
      </main>
    </div>
  );
}
