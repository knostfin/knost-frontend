import axios from 'axios';

const base = import.meta.env.VITE_API_URL || '';
const API = axios.create({
  baseURL: `${base}/api/investments`,
  withCredentials: false,
});

// Attach access token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Investment Management
export const addInvestment = (data) => API.post('/', data);
export const getInvestments = (params) => API.get('/', { params });
export const getInvestmentDetails = (id) => API.get(`/${id}`);
export const updateInvestment = (id, data) => API.put(`/${id}`, data);
export const deleteInvestment = (id) => API.delete(`/${id}`);
export const getInvestmentBreakdown = () => API.get('/breakdown/types');

export default API;
