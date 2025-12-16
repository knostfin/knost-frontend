import axios from 'axios';

const base = import.meta.env.VITE_API_URL || '';
const API = axios.create({
  baseURL: `${base}/api/debts`,
  withCredentials: false,
});

// Attach access token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Debt Management
export const addDebt = (data) => API.post('/', data);
export const getDebts = (params) => API.get('/', { params });
export const getDebtDetails = (id) => API.get(`/${id}`);
export const updateDebt = (id, data) => API.put(`/${id}`, data);
export const deleteDebt = (id) => API.delete(`/${id}`);
export const payDebt = (id, data) => API.post(`/${id}/pay`, data);
export const getMonthlyDebtsDue = (params) => API.get('/monthly-due/list', { params });

export default API;
