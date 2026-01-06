import { useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Decode JWT exp (seconds) safely
const getExpiry = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

export function useTokenRefresh() {
  const { accessToken, refresh } = useContext(AuthContext);

  useEffect(() => {
    if (!accessToken) return undefined;

    const refreshAheadMs = 5 * 60 * 1000; // refresh 5 minutes before expiry
    const intervalMs = 60 * 1000; // check every minute

    const interval = setInterval(async () => {
      const exp = getExpiry(accessToken);
      if (!exp) return;
      const now = Date.now();
      if (exp - now <= refreshAheadMs) {
        try {
          const success = await refresh();
          if (!success) {
            console.warn('Proactive token refresh failed');
          }
        } catch (err) {
          console.error('Token refresh interval error:', err);
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [accessToken, refresh]);
}
