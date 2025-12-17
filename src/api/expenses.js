import { createApiClient } from './apiClient';

const API = createApiClient('/api/expenses');

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
export const addCategory = (data) => API.post('/categories', data);

export default API;
