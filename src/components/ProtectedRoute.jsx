import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { accessToken, verify, refresh, loading, logout } = useContext(AuthContext);
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function check() {
      // Wait for auth to finish loading stored tokens/user
      if (loading) return;

      // No token after loading => unauthenticated
      if (!accessToken) {
        if (mounted) setOk(false);
        return;
      }

      // Try to verify token
      const v = await verify();
      if (mounted && v) {
        setOk(true);
        return;
      }

      // If verify failed, try refreshing token
      const r = await refresh();
      if (mounted && r) {
        setOk(true);
      } else if (mounted) {
        // Both verify and refresh failed - clear stale tokens and redirect
        await logout();
        setOk(false);
      }
    }

    check();

    // Cleanup to prevent memory leaks
    return () => {
      mounted = false;
    };
  }, [refresh, verify, accessToken, loading, logout]);

  // Loading state
  if (loading || ok === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="w-16 h-16 rounded-full border-4 border-slate-700/30 border-t-transparent animate-spin"></div>
            {/* Inner pulsing ring */}
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" style={{ animationDuration: '0.8s' }}></div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-teal-400/10 blur-xl animate-pulse"></div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-slate-200 font-semibold text-lg">Authenticating</p>
            <p className="text-slate-400 text-sm">Verifying your session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to welcome page (/) so logout lands there
  if (!ok) {
    return <Navigate to="/" replace />;
  }

  // Authenticated - render children
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
