import axios from 'axios';

const base = import.meta.env.VITE_API_URL || ''; // empty -> same-origin (CRA dev proxy handles /api)
const API = axios.create({
  baseURL: `${base}/api/auth`,
  withCredentials: false,
});

// attach access token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // Prevent caching of auth endpoints
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  
  return config;
});

// Handle token blacklist errors (revoked tokens)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if token was blacklisted/revoked
    if (error.response?.status === 401) {
      const errorMsg = error.response?.data?.message || '';
      if (errorMsg.includes('blacklist') || errorMsg.includes('revoked') || errorMsg.includes('revoked')) {
        // Clear tokens from storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => API.post('/register', data);
export const loginUser = (data) => API.post('/login', data);
export const refreshToken = (token) => API.post('/refresh', { token });
export const verifyToken = () => API.get('/verify');
export const logoutUser = (refreshToken) => API.post('/logout', { refreshToken });

// Get user profile. Backend should implement GET /api/auth/profile
export const getUserProfile = () => API.get('/profile');

// Update user profile. Backend should implement PUT /api/auth/profile
export const updateUser = (data) => API.put('/profile', data);

// Upload profile photo. Backend should implement POST /api/auth/profile/photo
export const uploadProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return API.post('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Change password. Backend should implement POST /api/auth/change-password
export const changePassword = (data) => API.post('/change-password', data);

// Request email verification. Backend should implement POST /api/auth/request-email-verify
export const requestEmailVerification = (email) => API.post('/request-email-verify', { email });

// Verify new email. Backend should implement POST /api/auth/verify-email
export const verifyNewEmail = (token) => API.post('/verify-email', { token });

// Request OTP for phone login
export const requestOtp = (phone, countryCode) => API.post('/request-otp', { phone, countryCode });

// Verify OTP and login
export const verifyOtp = (phone, otp, countryCode) => API.post('/verify-otp', { phone, otp, countryCode });

// Forgot Password - Request reset email
export const requestPasswordReset = (email) => API.post('/forgot-password', { email });

// Reset Password with token and email
export const resetPassword = ({ token, email, newPassword, confirmPassword }) => 
  API.post('/reset-password', { token, email, newPassword, confirmPassword });

export default API;
