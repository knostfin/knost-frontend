import axios from 'axios';

const base = import.meta.env.VITE_API_URL || '';
const API = axios.create({
  baseURL: `${base}/api/income`,
  withCredentials: false,
});

// Attach access token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Income Management
export const addIncome = (data) => API.post('/', data);
export const getIncome = (params) => API.get('/', { params });
export const getIncomeDetails = (id) => API.get(`/${id}`);
export const updateIncome = (id, data) => API.put(`/${id}`, data);
export const deleteIncome = (id) => API.delete(`/${id}`);
export const getIncomeSources = () => API.get('/sources/list');

export default API;
