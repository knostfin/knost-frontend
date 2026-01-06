import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { verifyToken, refreshToken as apiRefresh, logoutUser } from '../api/auth';

export const AuthContext = createContext();

 
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved tokens on mount (runs once)
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const userInfo = localStorage.getItem('user');
      if (token) setAccessToken(token);
      if (userInfo && userInfo !== 'undefined') {
        try {
          setUser(JSON.parse(userInfo));
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
          localStorage.removeItem('user');
        }
      }
      
      // Verify token is still valid on backend
      if (token) {
        try {
          const res = await verifyToken();
          const incoming = res.data.user;
          setUser(incoming);
          localStorage.setItem('user', JSON.stringify(incoming));
        } catch (err) {
          // Security: Generic message, no sensitive details
          console.warn('Stored token is invalid, clearing auth');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          // Refresh token cookie managed by browser/backend
          setAccessToken(null);
          setUser(null);
        }
      } else {
        // No token found; ensure user is cleared
        setUser(null);
        localStorage.removeItem('user');
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []); // Empty dependency array - runs only once on mount

  // Keep a ref to any in-flight verify promise so concurrent callers share it
  const verifyPromiseRef = useRef(null);

  // Helper to sync user state with localStorage; accepts value or updater fn
  const setUserState = useCallback((nextUserOrUpdater) => {
    setUser((prev) => {
      const resolved = typeof nextUserOrUpdater === 'function' ? nextUserOrUpdater(prev) : nextUserOrUpdater;
      const finalUser = resolved || null;
      if (finalUser) localStorage.setItem('user', JSON.stringify(finalUser));
      else localStorage.removeItem('user');
      return finalUser;
    });
  }, []);

  // Verify token - memoized to prevent recreation
  const verify = useCallback(
    async (options = {}) => {
      const force = options.force || false;
      if (!accessToken) return false; // Don't verify if no token

      // If we already have a user and no force refresh requested, return cached user
      if (!force && user) return user;

      // If a verify call is already in-flight and not forced, return the same promise
      if (!force && verifyPromiseRef.current) return verifyPromiseRef.current;

      // Create and store the in-flight promise
      const p = (async () => {
        try {
          const res = await verifyToken();
          const incoming = res.data.user;
          let merged = incoming;
          setUserState((prev) => {
            merged = prev ? { ...prev, ...incoming } : incoming;
            return merged;
          });
          return merged;
        } catch (err) {
          // Token expired or blacklisted - try to refresh
          if (err.response?.status === 401) {
            // Security: Generic log message
            console.warn('Token invalid, attempting refresh...');
            try {
              // Refresh token is in HttpOnly cookie, no need to pass it
              const refreshRes = await apiRefresh();
              if (refreshRes.data.accessToken) {
                localStorage.setItem('accessToken', refreshRes.data.accessToken);
                setAccessToken(refreshRes.data.accessToken);
                // Retry verification with new token
                const retryRes = await verifyToken();
                const incoming = retryRes.data.user;
                setUserState(incoming);
                return incoming;
              }
            } catch (refreshErr) {
              // Security: Generic error, no details logged
              console.error('Refresh failed');
            }
          }
          // Security: Generic error message
          console.error('Token verification failed');
          return false;
        } finally {
          // clear ref when finished
          verifyPromiseRef.current = null;
        }
      })();

      verifyPromiseRef.current = p;
      return p;
    },
    [accessToken, setUserState, user]
  );

  // Login: store access token + user (refresh token is in HttpOnly cookie)
  const login = useCallback(
    (token, _refresh, userObj) => {
      // Note: _refresh param kept for backward compatibility but not stored
      // Refresh token is now managed via HttpOnly cookie by backend
      setAccessToken(token);
      setUserState(userObj || null);
      localStorage.setItem('accessToken', token);
    },
    [setUserState]
  );

  // Logout: blacklist tokens server-side and clear local storage
  const logout = useCallback(async () => {
    const t = localStorage.getItem('accessToken');
    
    // Call backend logout to blacklist tokens (refresh token sent via HttpOnly cookie)
    if (t) {
      try {
        await logoutUser();
      } catch (e) {
        // Still clear local storage even if backend call fails
        // Security: Generic warning, no error details
        console.warn('Logout call failed, clearing local tokens');
      }
    }
    
    // Always clear local storage (refresh token cookie cleared by backend)
    localStorage.removeItem('accessToken');
    setUserState(null);
    setAccessToken(null);
    
    // Clear verify promise cache
    verifyPromiseRef.current = null;
  }, [setUserState]);

  // Refresh access token using refresh token (sent via HttpOnly cookie)
  const refresh = useCallback(async () => {
    try {
      // Refresh token is in HttpOnly cookie, no need to pass it
      const res = await apiRefresh();
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        setAccessToken(res.data.accessToken);
        return true;
      }
    } catch (e) {
      // Security: Generic error, no sensitive details
      console.error('Token refresh failed');
      return false;
    }
    return false;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
        verify,
        refresh,
        setUser: setUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
