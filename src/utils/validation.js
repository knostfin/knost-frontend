// Validation helpers
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) ? '' : 'Invalid email address';
};

// Validate phone in combined format: +{countrycode}{10digits}
// E.g., +919876543210
export const validatePhone = (phone) => {
  const regex = /^\+\d{1,3}\d{10}$/;
  return regex.test(phone) ? '' : 'Phone must be in format +{countrycode}{10digits} (e.g., +919876543210)';
};

// Validate phone number only (10 digits) - used when entering phone separately from country code
export const validatePhoneNumber = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone) ? '' : 'Phone must be 10 digits';
};

// Validate country code (1-3 digits, no leading zero)
export const validateCountryCode = (code) => {
  const regex = /^[1-9]\d{0,2}$/;
  return regex.test(code) ? '' : 'Country code must be 1-3 digits without leading zero';
};

// Format phone from separate country code and phone number into combined format
export const formatPhoneFromParts = (countryCode, phone) => {
  // Remove any non-digits from country code and phone
  const cleanCountry = countryCode.replace(/\D/g, '');
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Validate inputs
  if (!cleanCountry || !cleanPhone) {
    return '';
  }
  
  // Return combined format: +{countrycode}{phone}
  return `+${cleanCountry}${cleanPhone}`;
};

export const validateName = (name) => {
  return name.trim().length >= 2 ? '' : 'Must be at least 2 characters';
};

export const validatePassword = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must contain an uppercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain a number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Must contain a special character';
  return '';
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
