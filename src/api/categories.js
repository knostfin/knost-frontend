import { createApiClient } from './apiClient';

const API = createApiClient('/api/categories');

// Get all categories (optionally filtered by type)
export const getCategories = (type) => {
  const params = type ? { type } : {};
  return API.get('', { params });
};

// Create or update a category (upsert)
export const saveCategory = (data) => API.post('', data);

export default API;
