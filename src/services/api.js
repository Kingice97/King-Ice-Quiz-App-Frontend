import axios from 'axios';

console.log('🔄 DEBUG: api.js LOADED - version 1.0.8 - OPTIMIZED FOR RENDER.COM');

// ✅ FIXED: Use the correct Render URL
const API_URL = process.env.REACT_APP_API_URL || 'https://king-ice-quiz-app.onrender.com';

console.log('🔄 DEBUG: API_URL:', API_URL);

// Create axios instance with better configuration for Render.com
const api = axios.create({
  baseURL: API_URL + '/api',
  timeout: 30000, // ✅ INCREASED to 30 seconds for Render.com free tier
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false;

// Request interceptor - improved with better logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Add debug logging for requests
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
      hasToken: !!token,
      timeout: config.timeout,
      endpoint: config.url
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token added to request:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No token found for request');
    }
    
    // Special handling for file uploads - longer timeout
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      config.timeout = 45000; // 45 seconds for uploads
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - FIXED: Prevent automatic redirect on 401
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
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
      });
      
      // ✅ FIXED: Only redirect on 401 for specific endpoints, not upload
      if (status === 401) {
        console.log('🛑 401 Unauthorized - checking if we should redirect...');
        
        // Don't redirect for upload endpoints - let the component handle it
        if (originalRequest?.url?.includes('/upload')) {
          console.log('📸 Upload request failed with 401 - not redirecting');
          error.userMessage = 'Please log in again to upload files.';
        } 
        // Only redirect for auth-related endpoints
        else if (originalRequest?.url?.includes('/auth/me') || 
                 originalRequest?.url?.includes('/users/profile')) {
          console.log('🔐 Auth check failed - redirecting to login');
          
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
        } else {
          console.log('⚠️ 401 on non-auth endpoint - not redirecting');
          error.userMessage = data?.message || 'Authentication required.';
        }
      }
      
      else if (status === 403) {
        console.error('🔒 Forbidden:', data?.message || 'Access denied');
        error.userMessage = data?.message || 'You do not have permission to perform this action.';
      }
      
      else if (status === 404) {
        console.error('🔍 404 Not Found:', originalRequest?.url);
        error.userMessage = data?.message || 'The requested resource was not found.';
      }
      
      else if (status === 429) {
        console.error('🚦 429 Rate Limited');
        error.userMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      else if (status >= 500) {
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
        code: error.code,
        timeout: originalRequest?.timeout
      });
      
      // Differentiate between timeout and other network errors
      if (error.code === 'ECONNABORTED') {
        error.userMessage = 'Server is taking too long to respond. This is normal on free hosting. Please wait and try again.';
      } else if (error.message === 'Network Error') {
        error.userMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        error.userMessage = 'Network error. Please try again.';
      }
      
    } else {
      // Something else happened in setting up the request
      console.error('⚡ Request setup error:', error.message);
      error.userMessage = 'An unexpected error occurred. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

// ✅ NEW: Health check function for server status
export const checkServerHealth = async () => {
  try {
    console.log('🏥 Checking server health...');
    const response = await axios.get(API_URL + '/health', {
      timeout: 10000
    });
    console.log('✅ Server health check passed');
    return { healthy: true, response: response.data };
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return { healthy: false, error: error.message };
  }
};

// ✅ NEW: Check if server is reachable
export const isServerReachable = async () => {
  try {
    const response = await axios.get(API_URL, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.log('🌐 Server reachability check:', error.message);
    return false;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  
  console.log('🔐 Auth check:', {
    tokenExists: !!token,
    userDataExists: !!userData,
    token: token ? token.substring(0, 20) + '...' : 'none'
  });
  
  return !!(token && userData);
};

// Helper function to get current user data
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    const user = userData ? JSON.parse(userData) : null;
    
    console.log('👤 Current user:', user ? user.username : 'none');
    return user;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Helper function to set auth tokens
export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
  console.log('💾 Token saved to localStorage');
};

// Helper function to clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  isRedirecting = false;
  console.log('🧹 Auth data cleared');
};

// Create a cancel token source for cancelling requests
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

// Export the api instance and helpers
export default api;