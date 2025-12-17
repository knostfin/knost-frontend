import axios from 'axios';

const base = import.meta.env.VITE_API_URL || '';

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
    withCredentials: false,
  });

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

      // If 401 and not already retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Check if it's a blacklisted/revoked token error
        const errorMsg = error.response?.data?.message || '';
        if (errorMsg.includes('blacklist') || errorMsg.includes('revoked')) {
          // Clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh token
        if (isRefreshing) {
          // If already refreshing, queue this request
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

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        try {
          // Call refresh endpoint
          const response = await axios.post(`${base}/api/auth/refresh`, {
            token: refreshToken,
          });

          const newAccessToken = response.data.accessToken;
          localStorage.setItem('accessToken', newAccessToken);

          // Update auth header and retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          
          return API(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          processQueue(refreshError, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return API;
};
