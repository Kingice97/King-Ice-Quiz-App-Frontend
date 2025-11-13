import api from './api';

export const chatService = {
  // Get chat messages for a quiz
  getQuizMessages: async (quizId, limit = 50) => {
    try {
      const response = await api.get(`/chat/quiz/${quizId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch messages for quiz ${quizId}:`, error);
      return { success: false, data: [] };
    }
  },

  // Get global chat messages
  getGlobalMessages: async (limit = 50) => {
    try {
      const response = await api.get('/chat/global', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch global messages:', error);
      return { success: false, data: [] };
    }
  },

  // Get user's chat history
  getUserChats: async (params = {}) => {
    try {
      const response = await api.get('/chat/user/chats', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user chats:', error);
      return { success: false, data: [] };
    }
  },

  // Get user's conversations
  getUserConversations: async () => {
    let timeoutId;
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await api.get('/conversations', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data && response.data.success !== undefined) {
        return response.data;
      } else {
        return { success: false, data: [], message: 'Unexpected response format' };
      }
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return { success: false, data: [], message: 'Request timeout' };
      }
      
      if (error.response) {
        return { 
          success: false, 
          data: [], 
          message: error.response.data?.message || `Server error: ${error.response.status}` 
        };
      } else if (error.request) {
        return { success: false, data: [], message: 'No response from server' };
      } else {
        return { success: false, data: [], message: error.message };
      }
    }
  },

  // Get messages for a specific conversation
  getConversationMessages: async (otherUserId, limit = 50) => {
    try {
      const response = await api.get(`/chat/conversation/${otherUserId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch conversation messages:`, error);
      return { success: false, data: [] };
    }
  },

  // Start a new conversation
  startConversation: async (otherUserId) => {
    try {
      const response = await api.post('/chat/conversation/start', { otherUserId });
      return response.data;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  },

  // Delete a message (own messages only)
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/chat/message/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  },

  // Report a message
  reportMessage: async (messageId, reason) => {
    try {
      const response = await api.post(`/chat/message/${messageId}/report`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to report message:', error);
      throw error;
    }
  },

  // Get chat statistics
  getChatStats: async () => {
    try {
      const response = await api.get('/chat/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch chat stats:', error);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (quizId) => {
    try {
      const response = await api.post(`/chat/quiz/${quizId}/read`);
      return response.data;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  },

  // Mark conversation messages as read
  markConversationAsRead: async (otherUserId) => {
    try {
      const response = await api.post(`/chat/conversation/${otherUserId}/read`);
      return response.data;
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      throw error;
    }
  }
};