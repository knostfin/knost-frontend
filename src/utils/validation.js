// Validation helpers
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) ? '' : 'Invalid email address';
};

export const validatePhone = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone) ? '' : 'Phone must be 10 digits';
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
