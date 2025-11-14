import axios from 'axios';

// ✅ CORRECT: No /api in the base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with better configuration
const api = axios.create({
  baseURL: API_URL + '/api',  // ✅ Add /api here only
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        hasToken: !!token,
      });
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      if (config.url?.includes('/upload')) {
        config.timeout = 30000;
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    if (error.response) {
      const { status, data } = error.response;
      
      console.error(`❌ API Error ${status}:`, {
        message: data?.message || error.message,
      });
      
      if (status === 401) {
        console.log('🛑 401 Unauthorized - clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        if (!isRedirecting && !window.location.pathname.includes('/login')) {
          isRedirecting = true;
          setTimeout(() => {
            window.location.href = '/login?session=expired';
          }, 100);
        }
      }
    } else if (error.request) {
      console.error('🌐 Network error:', error.message);
      error.userMessage = 'Network error. Please check your internet connection.';
    } else {
      console.error('⚡ Request setup error:', error.message);
      error.userMessage = 'An unexpected error occurred. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  return !!(token && userData);
};

export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  isRedirecting = false;
};

export const createCancelToken = () => {
  return axios.CancelToken.source();
};

export default api;