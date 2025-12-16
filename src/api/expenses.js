import axios from 'axios';

const base = import.meta.env.VITE_API_URL || '';
const API = axios.create({
  baseURL: `${base}/api/expenses`,
  withCredentials: false,
});

// Attach access token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Recurring Expense Templates
export const addRecurringExpense = (data) => API.post('/recurring', data);
export const getRecurringExpenses = (params) => API.get('/recurring', { params });
export const updateRecurringExpense = (id, data) => API.put(`/recurring/${id}`, data);
export const deleteRecurringExpense = (id) => API.delete(`/recurring/${id}`);

// Monthly Expenses
export const generateMonthlyExpenses = (monthYear) => API.post(`/generate/${monthYear}`);
export const getMonthlyExpenses = (params) => API.get('/monthly', { params });
export const addMonthlyExpense = (data) => API.post('/monthly', data);
export const updateMonthlyExpense = (id, data) => API.put(`/monthly/${id}`, data);
export const deleteMonthlyExpense = (id) => API.delete(`/monthly/${id}`);
export const markExpensePaid = (id) => API.post(`/monthly/${id}/mark-paid`);

// Categories
export const getCategories = () => API.get('/categories');

export default API;
