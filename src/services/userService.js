import api from './api';

export const userService = {
  // Profile management endpoints (for current user)
  updateProfile: async (profileData) => {
    try {
      console.log('📋 Updating user profile:', profileData);
      const response = await api.put('/auth/profile', profileData);
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
      const response = await api.put('/auth/password', passwordData);
      console.log('✅ Password change successful');
      return response.data;
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  },

  // Profile picture upload
  uploadProfilePicture: async (formData) => {
    try {
      console.log('🖼️ Uploading profile picture');
      const response = await api.post('/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
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

  // Remove profile picture
  removeProfilePicture: async () => {
    try {
      console.log('🗑️ Removing profile picture');
      const response = await api.delete('/upload/profile-picture');
      console.log('✅ Profile picture removed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Profile picture removal failed:', error);
      throw error;
    }
  },

  // Update chat preferences - FIXED: Use auth endpoint instead of admin-only endpoint
  updateChatPreferences: async (preferences) => {
    try {
      console.log('⚙️ Updating chat preferences:', preferences);
      
      // ✅ FIXED: Use the auth profile endpoint which regular users can access
      const response = await api.put('/auth/profile', {
        preferences: preferences
      });
      
      console.log('✅ Chat preferences updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Chat preferences update failed:', error);
      throw error;
    }
  },

  // Update user preferences (general)
  updateUserPreferences: async (preferences) => {
    try {
      console.log('⚙️ Updating user preferences:', preferences);
      
      // ✅ FIXED: Use the auth profile endpoint which regular users can access
      const response = await api.put('/auth/profile', {
        preferences: preferences
      });
      
      console.log('✅ User preferences updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ User preferences update failed:', error);
      throw error;
    }
  },

  // Get user preferences
  getUserPreferences: async () => {
    try {
      console.log('⚙️ Fetching user preferences');
      const response = await api.get('/auth/profile');
      console.log('✅ User preferences fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user preferences:', error);
      throw error;
    }
  },

  // Get online users for chat
  getOnlineUsers: async () => {
    try {
      console.log('👥 Fetching online users');
      const response = await api.get('/users/online');
      console.log(`✅ Found ${response.data?.data?.length || 0} online users`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch online users:', error);
      return { data: [] };
    }
  },

  // Search users for chat
  searchUsers: async (query, limit = 20) => {
    try {
      console.log(`🔍 Searching users: "${query}"`);
      
      if (!query || query.trim() === '') {
        console.log('🔄 Empty query, returning empty results');
        return { success: true, data: [] };
      }
      
      const response = await api.get('/users/search/users', {
        params: { 
          q: query.trim(), 
          limit: limit 
        }
      });
      
      console.log(`✅ Search found ${response.data?.data?.length || 0} users`);
      return response.data;
    } catch (error) {
      console.error('❌ User search failed:', error);
      return { 
        success: false, 
        data: [],
        message: 'Search temporarily unavailable'
      };
    }
  },

  // Get user profile by username
  getUserProfile: async (username) => {
    try {
      console.log(`👤 Fetching profile for: ${username}`);
      const response = await api.get(`/users/profile/${username}`);
      console.log('✅ User profile fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      console.log(`👤 Fetching user by ID: ${userId}`);
      const response = await api.get(`/users/${userId}`);
      console.log('✅ User fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user:', error);
      throw error;
    }
  },

  // Get leaderboard
  getLeaderboard: async (params = {}) => {
    try {
      console.log('🏆 Fetching leaderboard');
      const response = await api.get('/users/leaderboard', { params });
      console.log('✅ Leaderboard fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch leaderboard:', error);
      throw error;
    }
  },

  // Get user stats
  getUserStats: async () => {
    try {
      console.log('📊 Fetching user stats');
      const response = await api.get('/users/stats');
      console.log('✅ User stats fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user stats:', error);
      throw error;
    }
  },

  // Get user's chat history/activity
  getUserChats: async (params = {}) => {
    try {
      console.log('💬 Fetching user chats');
      const response = await api.get('/users/chats', { params });
      console.log('✅ User chats fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user chats:', error);
      throw error;
    }
  },

  // Update user online status
  updateOnlineStatus: async (isOnline) => {
    try {
      console.log(`🌐 Updating online status: ${isOnline}`);
      const response = await api.patch('/users/online-status', { isOnline });
      console.log('✅ Online status updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update online status:', error);
      throw error;
    }
  },

  // Get user's recent activity
  getRecentActivity: async (limit = 10) => {
    try {
      console.log('📈 Fetching recent activity');
      const response = await api.get('/users/activity/recent', {
        params: { limit }
      });
      console.log('✅ Recent activity fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch recent activity:', error);
      throw error;
    }
  },

  // Admin only endpoints
  getUsers: async (params = {}) => {
    try {
      console.log('👥 Fetching users list (admin)');
      const response = await api.get('/users', { params });
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
      const response = await api.get(`/users/${id}`);
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
      const response = await api.put(`/users/${id}`, userData);
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
      const response = await api.delete(`/users/${id}`);
      console.log('✅ User deleted successfully (admin)');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to delete user (admin):', error);
      throw error;
    }
  },

  // Admin - Get system statistics
  getSystemStats: async () => {
    try {
      console.log('📈 Fetching system stats (admin)');
      const response = await api.get('/admin/stats');
      console.log('✅ System stats fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch system stats:', error);
      throw error;
    }
  }
};