import { createApiClient } from './apiClient';

const API = createApiClient('/api/expenses');

// ==========================================
// Recurring Expense Templates (CRUD)
// ==========================================
// POST /api/expenses/recurring - Create a recurring template
export const addRecurringExpense = (data) => API.post('/recurring', data);

// PUT /api/expenses/recurring/:id - Update a template
export const updateRecurringExpense = (id, data) => API.put(`/recurring/${id}`, data);

// DELETE /api/expenses/recurring/:id - Delete (detaches paid, removes pending)
export const deleteRecurringExpense = (id) => API.delete(`/recurring/${id}`);

// ==========================================
// Monthly Expenses
// ==========================================
// POST /api/expenses/generate/:month_year - Generate expenses from templates
export const generateMonthlyExpenses = (monthYear) => API.post(`/generate/${monthYear}`);

// GET /api/expenses/monthly - Get monthly expenses (?month_year=YYYY-MM&status=pending)
export const getMonthlyExpenses = (params) => API.get('/monthly', { params });

// POST /api/expenses/monthly - Add a one-off expense (not from template)
export const addMonthlyExpense = (data) => API.post('/monthly', data);

// PUT /api/expenses/monthly/:id - Update a monthly expense
export const updateMonthlyExpense = (id, data) => API.put(`/monthly/${id}`, data);

// POST /api/expenses/monthly/:id/mark-paid - Mark as paid
export const markExpenseAsPaid = (id) => API.post(`/monthly/${id}/mark-paid`);

// DELETE /api/expenses/monthly/:id - Delete a monthly expense
export const deleteMonthlyExpense = (id) => API.delete(`/monthly/${id}`);

export default API;
