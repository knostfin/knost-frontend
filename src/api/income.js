import { createApiClient } from './apiClient';

const API = createApiClient('/api/income');

// Income Management
export const addIncome = (data) => API.post('/', data);
export const getIncome = (params) => API.get('/', { params });
export const updateIncome = (id, data) => API.put(`/${id}`, data);
export const deleteIncome = (id) => API.delete(`/${id}`);

export default API;
