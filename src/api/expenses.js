import { createApiClient } from './apiClient';

const API = createApiClient('/api/expenses');
const CategoryAPI = createApiClient('/api/categories');

// Recurring Expense Templates
export const addRecurringExpense = (data) => API.post('/recurring', data);
export const getRecurringExpenses = (params) => API.get('/recurring', { params });
export const updateRecurringExpense = (id, data) => API.put(`/recurring/${id}`, data);
export const deleteRecurringExpense = (id, params) => API.delete(`/recurring/${id}`, { params });

// Monthly Expenses
export const generateMonthlyExpenses = (monthYear) => API.post(`/generate/${monthYear}`);
export const getMonthlyExpenses = (params) => API.get('/monthly', { params });
export const addMonthlyExpense = (data) => API.post('/monthly', data);
export const updateMonthlyExpense = (id, data) => API.put(`/monthly/${id}`, data);
export const deleteMonthlyExpense = (id) => API.delete(`/monthly/${id}`);
export const markExpensePaid = (id) => API.post(`/monthly/${id}/mark-paid`);

// Categories (new global category endpoints)
export const getCategories = (params) => CategoryAPI.get('/', { params });
export const addCategory = (data) => CategoryAPI.post('/', data);

export default API;
