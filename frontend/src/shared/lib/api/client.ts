/**
 * shared/lib/api/client.ts
 * Axios instance, base URL, and auth interceptor.
 */

import axios from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:7860/v1';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every outgoing request
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('invesa_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle expired or invalid JWT tokens by logging the user out
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('invesa_token');
      localStorage.removeItem('invesa_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
