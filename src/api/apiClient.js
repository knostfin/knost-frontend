import axios from 'axios';

const base = import.meta.env.VITE_API_URL;

if (!base) {
  throw new Error('VITE_API_URL environment variable is not set');
}

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const createApiClient = (baseURL) => {
  const API = axios.create({
    baseURL: `${base}${baseURL}`,
    withCredentials: true, // Required for HttpOnly refresh token cookies
    timeout: 30000, // Increased timeout for cold starts
  });

  if (import.meta.env.DEV) {
    API.interceptors.request.use((config) => {
      // Security: Do not log request body (may contain passwords, OTPs, tokens)
      console.debug('↗', config.method?.toUpperCase(), config.url);
      return config;
    });

    API.interceptors.response.use(
      (response) => {
        console.debug('↙', response.status, response.config?.url);
        return response;
      },
      (error) => {
        console.warn('✕', error.response?.status, error.config?.url, error.message);
        return Promise.reject(error);
      }
    );
  }

  // Request interceptor: Attach access token
  API.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: Handle 401 and auto-refresh token
  API.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const requestUrl = originalRequest?.url || '';

      // Skip token refresh for auth endpoints - these don't need refresh logic
      const authEndpoints = ['/login', '/register', '/request-otp', '/verify-otp', '/refresh', '/request-password-reset', '/reset-password'];
      const isAuthEndpoint = authEndpoints.some(endpoint => requestUrl.includes(endpoint));

      // If 401 and not already retried and not an auth endpoint
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        const status = error.response?.status;

        if (status === 401) {
          // Refresh token is now stored in HttpOnly cookie, managed by browser
          // Attempt refresh without checking localStorage

          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return API(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Refresh token is sent via HttpOnly cookie automatically
            const response = await axios.post(`${base}/api/auth/refresh`, {}, {
              withCredentials: true, // Ensure cookie is sent
            });

            const newAccessToken = response.data.accessToken;
            if (!newAccessToken) throw new Error('Missing access token from refresh');

            localStorage.setItem('accessToken', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return API(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            // Refresh token cookie cleared by backend or browser
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return API;
};
