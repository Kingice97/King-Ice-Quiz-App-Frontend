import api from './api';

// Retry wrapper function for handling rate limiting
const withRetry = async (apiCall, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      // Only retry on 429 (Too Many Requests) errors
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`🔄 Rate limited (429), retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

export const chatService = {
  // Get chat messages for a quiz
  getQuizMessages: async (quizId, limit = 50) => {
    return withRetry(async () => {
      try {
        const response = await api.get(`/chat/quiz/${quizId}`, {
          params: { limit }
        });
        return response.data;
      } catch (error) {
        console.error(`❌ Failed to fetch messages for quiz ${quizId}:`, error);
        return { success: false, data: [] };
      }
    });
  },

  // Get global chat messages
  getGlobalMessages: async (limit = 50) => {
    return withRetry(async () => {
      try {
        const response = await api.get('/chat/global', {
          params: { limit }
        });
        return response.data;
      } catch (error) {
        console.error('❌ Failed to fetch global messages:', error);
        return { success: false, data: [] };
      }
    });
  },

  // Get user's chat history
  getUserChats: async (params = {}) => {
    return withRetry(async () => {
      try {
        const response = await api.get('/chat/user/chats', { params });
        return response.data;
      } catch (error) {
        console.error('Failed to fetch user chats:', error);
        return { success: false, data: [] };
      }
    });
  },

  // Get user's conversations (with enhanced retry logic)
  getUserConversations: async () => {
    return withRetry(async () => {
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
          // Don't retry on client errors (4xx) except 429 (handled by withRetry)
          if (error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
            return { 
              success: false, 
              data: [], 
              message: error.response.data?.message || `Client error: ${error.response.status}` 
            };
          }
          throw error; // Let withRetry handle retryable errors
        } else if (error.request) {
          return { success: false, data: [], message: 'No response from server' };
        } else {
          return { success: false, data: [], message: error.message };
        }
      }
    });
  },

  // Get messages for a specific conversation
  getConversationMessages: async (otherUserId, limit = 50) => {
    return withRetry(async () => {
      try {
        const response = await api.get(`/chat/conversation/${otherUserId}`, {
          params: { limit }
        });
        return response.data;
      } catch (error) {
        console.error(`❌ Failed to fetch conversation messages:`, error);
        return { success: false, data: [] };
      }
    });
  },

  // Start a new conversation
  startConversation: async (otherUserId) => {
    return withRetry(async () => {
      try {
        const response = await api.post('/chat/conversation/start', { otherUserId });
        return response.data;
      } catch (error) {
        console.error('Failed to start conversation:', error);
        throw error;
      }
    });
  },

  // Delete a message (own messages only)
  deleteMessage: async (messageId) => {
    return withRetry(async () => {
      try {
        const response = await api.delete(`/chat/message/${messageId}`);
        return response.data;
      } catch (error) {
        console.error('Failed to delete message:', error);
        throw error;
      }
    });
  },

  // Report a message
  reportMessage: async (messageId, reason) => {
    return withRetry(async () => {
      try {
        const response = await api.post(`/chat/message/${messageId}/report`, { reason });
        return response.data;
      } catch (error) {
        console.error('Failed to report message:', error);
        throw error;
      }
    });
  },

  // Get chat statistics
  getChatStats: async () => {
    return withRetry(async () => {
      try {
        const response = await api.get('/chat/stats');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch chat stats:', error);
        throw error;
      }
    });
  },

  // Mark messages as read
  markMessagesAsRead: async (quizId) => {
    return withRetry(async () => {
      try {
        const response = await api.post(`/chat/quiz/${quizId}/read`);
        return response.data;
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
        throw error;
      }
    });
  },

  // Mark conversation messages as read
  markConversationAsRead: async (otherUserId) => {
    return withRetry(async () => {
      try {
        const response = await api.post(`/chat/conversation/${otherUserId}/read`);
        return response.data;
      } catch (error) {
        console.error('Failed to mark conversation as read:', error);
        throw error;
      }
    });
  },

  // Clear conversation history
  clearConversation: async (otherUserId) => {
    return withRetry(async () => {
      try {
        const response = await api.delete(`/chat/conversation/${otherUserId}`);
        return response.data;
      } catch (error) {
        console.error('Failed to clear conversation:', error);
        throw error;
      }
    });
  },

  // Report chat or user
  reportChat: async (chatId, reason) => {
    return withRetry(async () => {
      try {
        const response = await api.post('/chat/report', {
          chatId,
          reason,
          type: 'chat'
        });
        return response.data;
      } catch (error) {
        console.error('Failed to report chat:', error);
        throw error;
      }
    });
  },

  // Mute chat notifications
  muteChat: async (chatId, duration) => {
    return withRetry(async () => {
      try {
        const response = await api.post('/chat/mute', {
          chatId,
          duration
        });
        return response.data;
      } catch (error) {
        console.error('Failed to mute chat:', error);
        throw error;
      }
    });
  }

};