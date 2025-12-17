import { createApiClient } from './apiClient';

const API = createApiClient('/api/auth');

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
// Phone should be in combined format: +{countrycode}{10digits} or separate countryCode and 10-digit phone
export const requestOtp = (phoneOrCountryCode, phoneOrOtp) => {
  // Handle both formats: requestOtp(combinedPhone) or requestOtp(countryCode, phone)
  if (phoneOrOtp === undefined) {
    // Combined format: +919876543210
    return API.post('/request-otp', { phone: phoneOrCountryCode });
  }
  // Separate format: countryCode and phone parts
  const countryCode = phoneOrCountryCode;
  const phone = phoneOrOtp;
  return API.post('/request-otp', { countryCode, phone });
};

// Verify OTP and login
// Phone should be in combined format: +{countrycode}{10digits} or separate countryCode and 10-digit phone
export const verifyOtp = (phoneOrCountryCode, otpOrPhone, otpCode) => {
  // Handle both formats: verifyOtp(combinedPhone, otp) or verifyOtp(countryCode, phone, otp)
  if (otpCode === undefined) {
    // Combined format: verifyOtp('+919876543210', '123456')
    const phone = phoneOrCountryCode;
    const otp = otpOrPhone;
    return API.post('/verify-otp', { phone, otp });
  }
  // Separate format: verifyOtp(countryCode, phone, otp)
  const countryCode = phoneOrCountryCode;
  const phone = otpOrPhone;
  const otp = otpCode;
  return API.post('/verify-otp', { countryCode, phone, otp });
};

// Forgot Password - Request reset email
export const requestPasswordReset = (email) => API.post('/forgot-password', { email });

// Reset Password with token and email
export const resetPassword = ({ token, email, newPassword, confirmPassword }) => 
  API.post('/reset-password', { token, email, newPassword, confirmPassword });

export default API;
