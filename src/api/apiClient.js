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
    withCredentials: false,
    timeout: 10000,
  });

  if (import.meta.env.DEV) {
    API.interceptors.request.use((config) => {
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

      // If 401 and not already retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        const status = error.response?.status;

        if (status === 401) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(error);
          }

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
            const response = await axios.post(`${base}/api/auth/refresh`, {
              token: refreshToken,
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
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
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
