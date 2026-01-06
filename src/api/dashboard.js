import { createApiClient } from './apiClient';

const API = createApiClient('/api/dashboard');

const withSignal = (config = {}, signal) => (signal ? { ...config, signal } : config);

// Dashboard & Overview
export const getMonthlyOverview = (monthYear, config = {}, signal) => API.get(`/monthly/${monthYear}`, withSignal(config, signal));
export const getCategoryBreakdown = (monthYear, config = {}, signal) => API.get(`/category-breakdown/${monthYear}`, withSignal(config, signal));
export const getTrends = (params, signal) => API.get('/trends', withSignal({ params }, signal));
export const getLoanSummary = (loanId, config = {}, signal) => API.get(`/loan-summary/${loanId}`, withSignal(config, signal));
export const getAllTransactions = (monthYear, config = {}, signal) => API.get(`/transactions/${monthYear}`, withSignal(config, signal));

// Reports
export const downloadMonthlyReport = (monthYear) => API.get(`/report/download/${monthYear}`, { responseType: 'blob' });

export default API;
