import axios from 'axios';

// ✅ CORRECT: No /api in the base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with better configuration
const api = axios.create({
  baseURL: API_URL + '/api',  // ✅ Add /api here only
  timeout: 15000, // Increased timeout for file uploads and chat
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies and sessions
});

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false;

// Request interceptor - improved with better logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Add debug logging for requests
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        hasToken: !!token,
        data: config.data,
        params: config.params
      });
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Special handling for file uploads
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      // Remove timeout for file uploads as they can take longer
      if (config.url?.includes('/upload')) {
        config.timeout = 30000; // 30 seconds for uploads
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - improved with better error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Don't log cancelled requests (usually from navigation)
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // Log the error details
      console.error(`❌ API Error ${status}:`, {
        url: originalRequest?.url,
        method: originalRequest?.method,
        message: data?.message || error.message,
        data: data
      });
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        console.log('🛑 401 Unauthorized - clearing auth data');
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        // Prevent multiple redirects
        if (!isRedirecting && !window.location.pathname.includes('/login')) {
          isRedirecting = true;
          
          // Use setTimeout to avoid React state updates during render
          setTimeout(() => {
            window.location.href = '/login?session=expired';
          }, 100);
        }
      }
      
      else if (status === 403) {
        // Forbidden - user doesn't have permission
        console.error('🔒 Forbidden:', data?.message || 'Access denied');
        
        // Show user-friendly message for 403 errors
        if (data?.message) {
          error.userMessage = data.message;
        } else {
          error.userMessage = 'You do not have permission to perform this action.';
        }
      }
      
      else if (status === 404) {
        // Not found
        console.error('🔍 404 Not Found:', originalRequest?.url);
        error.userMessage = data?.message || 'The requested resource was not found.';
      }
      
      else if (status === 429) {
        // Rate limited
        console.error('🚦 429 Rate Limited');
        error.userMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      else if (status >= 500) {
        // Server error
        console.error('💥 Server Error:', status, data?.message);
        error.userMessage = data?.message || 'Server error. Please try again later.';
      }
      
      else {
        // Other client errors (400, 422, etc.)
        error.userMessage = data?.message || 'An error occurred. Please try again.';
      }
      
    } else if (error.request) {
      // Request made but no response received (network error)
      console.error('🌐 Network error:', {
        url: originalRequest?.url,
        message: error.message,
        code: error.code
      });
      
      // Differentiate between timeout and other network errors
      if (error.code === 'ECONNABORTED') {
        error.userMessage = 'Request timeout. Please check your connection and try again.';
      } else {
        error.userMessage = 'Network error. Please check your internet connection.';
      }
      
    } else {
      // Something else happened in setting up the request
      console.error('⚡ Request setup error:', error.message);
      error.userMessage = 'An unexpected error occurred. Please try again.';
    }
    
    // Add original request info to error for debugging
    error.requestInfo = {
      url: originalRequest?.url,
      method: originalRequest?.method,
      baseURL: originalRequest?.baseURL
    };
    
    return Promise.reject(error);
  }
);

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  return !!(token && userData);
};

// Helper function to get current user data
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Helper function to set auth tokens
export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

// Helper function to clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  isRedirecting = false;
};

// Create a cancel token source for cancelling requests
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

// Export the api instance and helpers
export default api;