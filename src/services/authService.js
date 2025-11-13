import api from './api';

export const authService = {
  register: async (userData) => {
    try {
      console.log('📝 Registering user:', { username: userData.username, email: userData.email });
      const response = await api.post('/api/auth/register', userData, {
        timeout: 10000 // 10 second timeout
      });
      console.log('✅ Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      console.log('🔐 Logging in user:', { email: credentials.email });
      const response = await api.post('/api/auth/login', credentials, {
        timeout: 10000 // 10 second timeout
      });
      console.log('✅ Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  getMe: async () => {
    try {
      console.log('👤 Fetching current user data...');
      const response = await api.get('/api/auth/me', {
        timeout: 8000 // 8 second timeout for faster failure
      });
      console.log('✅ User data fetched successfully:', response.data);
      
      // FIXED: Handle different response structures
      // Some APIs return { user: {...} } and others return the user object directly
      if (response.data && response.data.user) {
        return response.data.user; // If backend returns { user: {...} }
      } else if (response.data && response.data._id) {
        return response.data; // If backend returns user object directly
      } else {
        console.error('❌ Unexpected response format:', response.data);
        throw new Error('Invalid user data format received from server');
      }
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error);
      
      // Provide more specific error messages
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - server is not responding');
      } else if (error.response?.status === 401) {
        throw new Error('Session expired - please log in again');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw error;
      }
    }
  },

  updateProfile: async (userData) => {
    try {
      console.log('📋 Updating user profile:', userData);
      const response = await api.put('/api/auth/profile', userData, {
        timeout: 10000
      });
      console.log('✅ Profile update successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      console.log('🔑 Changing password');
      const response = await api.put('/api/auth/password', passwordData, {
        timeout: 10000
      });
      console.log('✅ Password change successful');
      return response.data;
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  },

  // NEW: Logout function
  logout: async () => {
    try {
      console.log('👋 Logging out user');
      const response = await api.post('/api/auth/logout', {}, {
        timeout: 5000
      });
      console.log('✅ Logout successful');
      return response.data;
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Don't throw error for logout - we want to clear local data anyway
      return { success: true }; // Return success even if API call fails
    }
  },

  // NEW: Refresh token function
  refreshToken: async () => {
    try {
      console.log('🔄 Refreshing token');
      const response = await api.post('/api/auth/refresh-token', {}, {
        timeout: 8000
      });
      console.log('✅ Token refresh successful');
      return response.data;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  },

  // NEW: Verify token function
  verifyToken: async (token) => {
    try {
      console.log('🔍 Verifying token');
      const response = await api.post('/api/auth/verify-token', { token }, {
        timeout: 8000
      });
      console.log('✅ Token verification successful');
      return response.data;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      throw error;
    }
  }
};