import axios from 'axios';

const base = import.meta.env.VITE_API_URL || '';
const API = axios.create({
  baseURL: `${base}/api/loans`,
  withCredentials: false,
});

// Attach access token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Loan Management
export const addLoan = (data) => API.post('/', data);
export const getLoans = (params) => API.get('/', { params });
export const getLoanDetails = (id) => API.get(`/${id}`);
export const updateLoan = (id, data) => API.put(`/${id}`, data);
export const deleteLoan = (id) => API.delete(`/${id}`);
export const closeLoan = (id) => API.post(`/${id}/close`);

// EMI Payments
export const getPaymentSchedule = (loanId) => API.get(`/${loanId}/payments`);
// Payments with optional status filter
export const getLoanPayments = (loanId, params) => API.get(`/${loanId}/payments`, { params });
export const markEMIPaid = (loanId, paymentId) => API.post(`/${loanId}/payments/${paymentId}/mark-paid`);
export const getMonthlyEMIDue = (params) => API.get('/monthly-due/list', { params });

export default API;
