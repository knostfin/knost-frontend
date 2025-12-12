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
          console.warn('Stored token is invalid, clearing auth:', err.message);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setAccessToken(null);
          setUser(null);
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []); // Empty dependency array - runs only once on mount

  // Keep a ref to any in-flight verify promise so concurrent callers share it
  const verifyPromiseRef = useRef(null);

  // Helper to sync user state with localStorage
  const setUserState = useCallback((nextUser) => {
    setUser(nextUser || null);
    if (nextUser) localStorage.setItem('user', JSON.stringify(nextUser));
    else localStorage.removeItem('user');
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
            console.warn('Token invalid, attempting refresh...');
            try {
              const r = localStorage.getItem('refreshToken');
              if (r) {
                const refreshRes = await apiRefresh(r);
                if (refreshRes.data.accessToken) {
                  localStorage.setItem('accessToken', refreshRes.data.accessToken);
                  setAccessToken(refreshRes.data.accessToken);
                  // Retry verification with new token
                  const retryRes = await verifyToken();
                  const incoming = retryRes.data.user;
                  setUserState(incoming);
                  return incoming;
                }
              }
            } catch (refreshErr) {
              console.error('Refresh also failed:', refreshErr);
            }
          }
          console.error('Token verification failed:', err);
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

  // Login: store tokens + user
  const login = useCallback(
    (token, refresh, userObj) => {
      setAccessToken(token);
      setUserState(userObj || null);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refresh || '');
    },
    [setUserState]
  );

  // Logout: blacklist tokens server-side and clear local storage
  const logout = useCallback(async () => {
    const r = localStorage.getItem('refreshToken');
    const t = localStorage.getItem('accessToken');
    
    // Call backend logout to blacklist tokens
    if (r || t) {
      try {
        await logoutUser(r);
      } catch (e) {
        // Still clear local storage even if backend call fails
        console.warn('Logout call failed, but clearing local tokens:', e);
      }
    }
    
    // Always clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUserState(null);
    setAccessToken(null);
    
    // Clear verify promise cache
    verifyPromiseRef.current = null;
  }, [setUserState]);

  // Refresh access token using refresh token
  const refresh = useCallback(async () => {
    const r = localStorage.getItem('refreshToken');
    if (!r) return false;
    try {
      const res = await apiRefresh(r);
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        setAccessToken(res.data.accessToken);
        return true;
      }
    } catch (e) {
      console.error('Token refresh failed:', e);
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
