import { createApiClient } from './apiClient';

const API = createApiClient('/api/dashboard');

// Dashboard & Overview
export const getMonthlyOverview = (monthYear) => API.get(`/monthly/${monthYear}`);
export const getMonthSummary = (monthYear) => API.get(`/summary/${monthYear}`);
export const getCategoryBreakdown = (monthYear) => API.get(`/category-breakdown/${monthYear}`);
export const getTrends = (params) => API.get('/trends', { params });
export const calculateEMI = (data) => API.post('/calculate-emi', data);
export const getLoanSummary = (loanId) => API.get(`/loan-summary/${loanId}`);
export const getMultiMonthView = (params) => API.get('/range', { params });
export const getMonthStatus = (monthYear) => API.get(`/status/${monthYear}`);
export const getAllTransactions = (monthYear) => API.get(`/transactions/${monthYear}`);
export const getYearlySummary = (year) => API.get(`/year/${year}`);

export default API;
