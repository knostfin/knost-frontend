import { useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook to proactively refresh access token before expiration
 * Since tokens expire in 15 minutes, refresh every 10 minutes
 */
export function useTokenRefresh() {
  const { accessToken, refresh } = useContext(AuthContext);

  useEffect(() => {
    if (!accessToken) return;

    // Refresh every 10 minutes (600 seconds)
    // This keeps the token fresh before it expires at 15 minutes
    const interval = setInterval(async () => {
      try {
        const success = await refresh();
        if (!success) {
          console.warn('Proactive token refresh failed');
        }
      } catch (err) {
        console.error('Token refresh interval error:', err);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [accessToken, refresh]);
}
