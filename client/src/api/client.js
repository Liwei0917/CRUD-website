import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({ https://curdwebsite_simple.netlify.app/api });

export const TOKEN_KEY = 'crud_token';

// Attach the JWT to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error messages and auto-logout on 401.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
    const details = error.response?.data?.details;

    if (status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      // Let the app react (redirect to login) via a custom event.
      window.dispatchEvent(new Event('auth:logout'));
    }

    return Promise.reject(Object.assign(new Error(message), { status, details }));
  }
);

export default api;
