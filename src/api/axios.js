import axios from 'axios';

const TOKEN_KEY = 'billing_admin_token';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '') + '/uploads';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle expired sessions, but let auth endpoints surface their own errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = /\/admin\/auth\//.test(error.config?.url || '');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('billing_admin_temp_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
