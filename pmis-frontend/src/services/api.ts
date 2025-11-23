import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { store } from '../store/store';
import { setTokens, logout } from '../store/slices/authSlice';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create Axios instance for the app
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // for cookie-based auth if needed
  timeout: 15000,
});

// Request interceptor: inject JWT access token
api.interceptors.request.use((config: AxiosRequestConfig) => {
  const state = store.getState();
  if (state.auth.tokens?.accessToken) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${state.auth.tokens.accessToken}`,
    };
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: handle error and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Handle expired token (401)
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh token
        const refreshToken = store.getState().auth.tokens?.refreshToken;
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const tokens = res.data.data.tokens;
        store.dispatch(setTokens(tokens));
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${tokens.accessToken}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }
    if (error.response?.status === 403) {
      // Optionally handle forbidden here
    }
    // Global error logging (dev only)
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  },
);

export default api;
