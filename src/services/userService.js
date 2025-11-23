import api from './api';

export const userService = {
  // Profile management endpoints (for current user)
  updateProfile: async (profileData) => {
    try {
      console.log('📋 Updating user profile:', profileData);
      const token = localStorage.getItem('token');
      const response = await api.put('/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Profile update successful');
      return response.data;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      console.log('🔑 Changing password');
      const token = localStorage.getItem('token');
      const response = await api.put('/auth/password', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Password change successful');
      return response.data;
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  },

  // Get user stats
  getUserStats: async () => {
    try {
      console.log('📊 Fetching user stats');
      const token = localStorage.getItem('token');
      const response = await api.get('/users/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User stats fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user stats:', error);
      // Return default stats if API fails
      return { 
        success: true, 
        data: { 
          overall: {
            totalQuizzesTaken: 0,
            averageScore: 0,
            bestScore: 0,
            successRate: 0,
            messagesSent: 0,
            chatParticipation: 0
          }
        } 
      };
    }
  },

  // Enhanced getLeaderboard with detailed debugging
  getLeaderboard: async (params = {}) => {
    try {
      console.log('🏆 Fetching leaderboard with params:', params);
      const token = localStorage.getItem('token');
      const response = await api.get('/users/leaderboard', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // FIXED: More detailed logging
      console.log('✅ Leaderboard API FULL response object:', response);
      console.log('✅ Leaderboard API response.data:', response.data);
      console.log('✅ Leaderboard API response.status:', response.status);
      
      // Log the actual data structure in detail
      if (response.data && response.data.data) {
        console.log('📊 Leaderboard data array length:', response.data.data.length);
        console.log('📊 Leaderboard data array:', response.data.data);
        
        // Log each user's data structure
        response.data.data.forEach((user, index) => {
          console.log(`👤 User ${index + 1} full data:`, JSON.stringify(user, null, 2));
          console.log(`📈 User ${index + 1} stats:`, {
            username: user.username,
            bestScore: user.bestScore,
            averageScore: user.averageScore,
            quizzesTaken: user.quizzesTaken,
            totalPoints: user.totalPoints,
            userObject: user.user // Check if user data is nested
          });
        });
      } else {
        console.warn('⚠️ No data array found in response:', response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Leaderboard API error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error details:', error.response?.data);
      // Return empty data structure instead of throwing error
      return { 
        success: false, 
        message: 'Failed to fetch leaderboard',
        data: [] 
      };
    }
  },

  // Profile picture upload
  uploadProfilePicture: async (formData) => {
    try {
      console.log('🖼️ Uploading profile picture');
      const token = localStorage.getItem('token');
      const response = await api.post('/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        timeout: 30000
      });
      console.log('✅ Profile picture upload successful');
      return response.data;
    } catch (error) {
      console.error('❌ Profile picture upload failed:', error);
      throw error;
    }
  },

  removeProfilePicture: async () => {
    try {
      console.log('🗑️ Removing profile picture');
      const token = localStorage.getItem('token');
      const response = await api.delete('/upload/profile-picture', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Profile picture removed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Profile picture removal failed:', error);
      throw error;
    }
  },

  // Update chat preferences
  updateChatPreferences: async (preferences) => {
    try {
      console.log('⚙️ Updating chat preferences:', preferences);
      const token = localStorage.getItem('token');
      const response = await api.put(
        '/auth/profile',
        { preferences },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Chat preferences updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Chat preferences update failed:', error);
      throw error;
    }
  },

  // General user preferences
  updateUserPreferences: async (preferences) => {
    try {
      console.log('⚙️ Updating user preferences:', preferences);
      const token = localStorage.getItem('token');
      const response = await api.put(
        '/auth/profile',
        { preferences },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ User preferences updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ User preferences update failed:', error);
      throw error;
    }
  },

  getUserPreferences: async () => {
    try {
      console.log('⚙️ Fetching user preferences');
      const token = localStorage.getItem('token');
      const response = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User preferences fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user preferences:', error);
      throw error;
    }
  },

  getOnlineUsers: async () => {
    try {
      console.log('👥 Fetching online users');
      const token = localStorage.getItem('token');
      const response = await api.get('/users/online', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Found ${response.data?.data?.length || 0} online users`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch online users:', error);
      return { data: [] };
    }
  },

  searchUsers: async (query, limit = 20) => {
    try {
      console.log(`🔍 Searching users: "${query}"`);
      if (!query || query.trim() === '') return { success: true, data: [] };
      const token = localStorage.getItem('token');
      const response = await api.get('/users/search/users', {
        params: { q: query.trim(), limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Search found ${response.data?.data?.length || 0} users`);
      return response.data;
    } catch (error) {
      console.error('❌ User search failed:', error);
      return { success: false, data: [], message: 'Search temporarily unavailable' };
    }
  },

  getUserProfile: async (username) => {
    try {
      console.log(`👤 Fetching profile for: ${username}`);
      const token = localStorage.getItem('token');
      const response = await api.get(`/users/profile/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User profile fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      throw error;
    }
  },

  getUserById: async (userId) => {
    try {
      console.log(`👤 Fetching user by ID: ${userId}`);
      const token = localStorage.getItem('token');
      const response = await api.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user:', error);
      throw error;
    }
  },

  // Admin endpoints
  getUsers: async (params = {}) => {
    try {
      console.log('👥 Fetching users list (admin)');
      const token = localStorage.getItem('token');
      const response = await api.get('/users', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Users list fetched: ${response.data?.data?.length || 0} users`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch users list:', error);
      throw error;
    }
  },

  getUser: async (id) => {
    try {
      console.log(`👤 Fetching user by ID (admin): ${id}`);
      const token = localStorage.getItem('token');
      const response = await api.get(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User fetched successfully (admin)');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user (admin):', error);
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      console.log(`✏️ Updating user (admin): ${id}`, userData);
      const token = localStorage.getItem('token');
      const response = await api.put(`/users/${id}`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User updated successfully (admin)');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update user (admin):', error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      console.log(`🗑️ Deleting user (admin): ${id}`);
      const token = localStorage.getItem('token');
      const response = await api.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User deleted successfully (admin)');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to delete user (admin):', error);
      throw error;
    }
  },

  getSystemStats: async () => {
    try {
      console.log('📈 Fetching system stats (admin)');
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ System stats fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch system stats:', error);
      throw error;
    }
  },

  // Block user
  blockUser: async (userId) => {
    try {
      console.log(`🚫 Blocking user: ${userId}`);
      const token = localStorage.getItem('token');
      const response = await api.post(`/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User blocked successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to block user:', error);
      throw error;
    }
  },

  // Unblock user
  unblockUser: async (userId) => {
    try {
      console.log(`✅ Unblocking user: ${userId}`);
      const token = localStorage.getItem('token');
      const response = await api.post(`/users/${userId}/unblock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User unblocked successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to unblock user:', error);
      throw error;
    }
  },

  // Report user
  reportUser: async (userId, reason) => {
    try {
      console.log(`🚨 Reporting user: ${userId}`, reason);
      const token = localStorage.getItem('token');
      const response = await api.post(`/users/${userId}/report`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User reported successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to report user:', error);
      throw error;
    }
  }

};