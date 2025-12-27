import { createApiClient } from './apiClient';

const API = createApiClient('/api/debts');

// Debt Management
export const addDebt = (data) => API.post('/', data);
export const getDebts = (params) => API.get('/', { params });
export const getDebtDetails = (id) => API.get(`/${id}`);
export const updateDebt = (id, data) => API.put(`/${id}`, data);
export const deleteDebt = (id) => API.delete(`/${id}`);
export const payDebt = (id, data) => API.post(`/${id}/pay`, data);
export const getMonthlyDebtsDue = (params) => API.get('/monthly-due/list', { params });

export default API;
