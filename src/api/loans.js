import { createApiClient } from './apiClient';

const API = createApiClient('/api/loans');

// Loan Management
export const addLoan = (data) => API.post('/', data);
export const getLoans = (params) => API.get('/', { params });
export const updateLoan = (id, data) => API.put(`/${id}`, data);
export const deleteLoan = (id) => API.delete(`/${id}`);
export const closeLoan = (id) => API.post(`/${id}/close`);
export const getMonthlyEMIDue = (params) => API.get('/monthly-due/list', { params });

// Loan Payments
export const markEMIPaid = (loanId, paymentId) => API.post(`/${loanId}/payments/${paymentId}/mark-paid`);

export default API;
