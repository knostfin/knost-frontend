import axios from 'axios';

const base = import.meta.env.VITE_API_URL || '';
const API = axios.create({
  baseURL: `${base}/api/finance`,
  withCredentials: false,
});

// Attach access token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getTransactions = (params) => API.get('/transactions', { params });
export const addTransaction = (data) => API.post('/transactions', data);
export const updateTransaction = (id, data) => API.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);
export const getCategoryBreakdown = (params) => API.get('/category-breakdown', { params });
export const getMonthlyTrend = (params) => API.get('/monthly-trend', { params });

export default API;
