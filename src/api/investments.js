import { createApiClient } from './apiClient';

const API = createApiClient('/api/investments');

// Investment Management
export const addInvestment = (data) => API.post('/', data);
export const getInvestments = (params) => API.get('/', { params });
export const getInvestmentDetails = (id) => API.get(`/${id}`);
export const updateInvestment = (id, data) => API.put(`/${id}`, data);
export const deleteInvestment = (id) => API.delete(`/${id}`);
export const getInvestmentBreakdown = () => API.get('/breakdown/types');

export default API;
