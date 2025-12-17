import { createApiClient } from './apiClient';

const API = createApiClient('/api/finance');

export const getTransactions = (params) => API.get('/transactions', { params });
export const addTransaction = (data) => API.post('/transactions', data);
export const updateTransaction = (id, data) => API.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);
export const getCategoryBreakdown = (params) => API.get('/category-breakdown', { params });
export const getMonthlyTrend = (params) => API.get('/monthly-trend', { params });

export default API;
