import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [conversations, setConversations] = useState([]);
  const { user, isAuthenticated } = useAuth();

  // Get stable user ID - handles both id and _id formats
  const getUserId = useCallback(() => {
    if (!user) return null;
    
    // Try _id first, then id
    const userId = user._id || user.id;
    
    console.log('🆔 User ID check:', {
      user: user,
      has_id: !!user._id,
      hasId: !!user.id,
      finalUserId: userId
    });
    
    return userId;
  }, [user]);

  // Check if user is blocked
  const checkIfBlocked = useCallback(async (otherUserId) => {
    try {
      const userId = getUserId();
      if (!userId || !otherUserId) return false;

      // Check if current user blocked the other user
      if (user.blockedUsers && user.blockedUsers.includes(otherUserId)) {
        console.log(`🚫 You have blocked user: ${otherUserId}`);
        return true;
      }

      // In a real app, you'd check if the other user blocked you via API
      // For now, we'll rely on the backend to handle this
      return false;
    } catch (error) {
      console.error('Error checking block status:', error);
      return false;
    }
  }, [user, getUserId]);

  // Initialize socket connection
  useEffect(() => {
    const userId = getUserId();
    
    console.log('🔄 SocketProvider: Checking connection conditions', {
      isAuthenticated,
      hasUser: !!user,
      userId: userId,
      userObject: user
    });

    if (!isAuthenticated || !userId) {
      console.log('🚫 SocketProvider: Not authenticated or no user ID, skipping connection');
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log('🚀 SocketProvider: Starting socket connection with user:', {
      userId: userId,
      username: user.username
    });
    
    // Clean up existing socket
    if (socket) {
      console.log('🧹 Cleaning up existing socket');
      socket.disconnect();
      setSocket(null);
    }

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('🔗 Connecting to:', API_URL);

    const newSocket = io(API_URL, {
      auth: {
        userId: userId,
        username: user.username
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ SOCKET CONNECTED! ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('connection_success', (data) => {
      console.log('✅ Server connection success:', data);
      setIsConnected(true);
    });

    // Message events
    newSocket.on('receive_message', (messageData) => {
      console.log('📩 Received message:', messageData);
      setMessages(prev => {
        const roomId = messageData.quiz || messageData.quizId;
        const existing = prev[roomId] || [];
        
        // Prevent duplicates
        if (existing.some(msg => msg._id === messageData._id)) {
          return prev;
        }
        
        return {
          ...prev,
          [roomId]: [...existing, messageData]
        };
      });
    });

    // Handle private messages
    newSocket.on('receive_private_message', async (messageData) => {
      console.log('📩 Received private message:', messageData);
      
      // Check if sender is blocked
      const isBlocked = await checkIfBlocked(messageData.user);
      if (isBlocked) {
        console.log('🚫 Ignoring message from blocked user:', messageData.user);
        return;
      }
      
      setMessages(prev => {
        const roomId = messageData.room;
        const existing = prev[roomId] || [];
        
        // Prevent duplicates
        if (existing.some(msg => msg._id === messageData._id)) {
          return prev;
        }
        
        return {
          ...prev,
          [roomId]: [...existing, messageData]
        };
      });
    });

    // Handle conversation updates
    newSocket.on('conversation_updated', (conversationData) => {
      console.log('💬 Conversation updated:', conversationData);
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv._id === conversationData._id);
        
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = conversationData;
          // Move to top
          const [moved] = updated.splice(existingIndex, 1);
          return [moved, ...updated];
        } else {
          // Add new conversation
          return [conversationData, ...prev];
        }
      });
    });

    // Online users
    newSocket.on('online_users_update', (users) => {
      console.log('👥 Online users updated:', users.length);
      setOnlineUsers(users);
    });

    // Typing indicators
    newSocket.on('user_typing', (data) => {
      console.log('⌨️ Typing:', data);
      setTypingUsers(prev => ({
        ...prev,
        [data.quizId]: data.isTyping 
          ? [...new Set([...(prev[data.quizId] || []), data.username])]
          : (prev[data.quizId] || []).filter(u => u !== data.username)
      }));
    });

    // NEW: Handle block-related events
    newSocket.on('user_blocked', (data) => {
      console.log('🚫 User blocked event:', data);
      // You can update UI or show notification
    });

    newSocket.on('user_unblocked', (data) => {
      console.log('✅ User unblocked event:', data);
      // You can update UI or show notification
    });

    // NEW: Handle message sending errors
    newSocket.on('message_blocked', (data) => {
      console.log('🚫 Message blocked:', data);
      // Show error to user
      alert('Message not sent: You are blocked by this user or have blocked them.');
    });

    // Cleanup
    return () => {
      console.log('🧹 SocketProvider cleanup');
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user, getUserId, checkIfBlocked]);

  // Socket methods
  const joinQuizRoom = useCallback((quizId) => {
    if (socket && isConnected && quizId) {
      console.log(`📚 Joining room: ${quizId}`);
      socket.emit('join_quiz_room', quizId);
    } else {
      console.warn('Cannot join room - socket not ready');
    }
  }, [socket, isConnected]);

  // Join private chat
  const joinPrivateChat = useCallback((recipientId) => {
    console.log(`🔐 Joining private chat with: ${recipientId}`);
    
    if (socket && isConnected && recipientId) {
      socket.emit('join_private_chat', recipientId);
    } else {
      console.warn('⚠️ Cannot join private chat: Socket not ready');
    }
  }, [socket, isConnected]);

  // Send a message
  const sendMessage = useCallback(async (quizId, message) => {
    if (!socket || !isConnected) {
      throw new Error('Not connected to chat');
    }

    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return new Promise((resolve, reject) => {
      const messageData = {
        quizId: quizId,
        userId: userId,
        username: user.username,
        profilePicture: user.profile?.picture,
        message: message.trim()
      };

      const timeout = setTimeout(() => {
        reject(new Error('Message sending timeout'));
      }, 5000);

      socket.emit('send_message', messageData, (response) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Send failed'));
        }
      });
    });
  }, [socket, isConnected, user, getUserId]);

  // Send private message
  const sendPrivateMessage = useCallback(async (recipientId, message) => {
    console.log(`📤 Sending private message to: ${recipientId}`);

    if (!socket || !isConnected) {
      throw new Error('Not connected to chat server');
    }

    if (!recipientId) {
      throw new Error('No recipient specified');
    }

    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Check if recipient is blocked
    const isBlocked = await checkIfBlocked(recipientId);
    if (isBlocked) {
      throw new Error('You have blocked this user. Unblock them to send messages.');
    }

    return new Promise((resolve, reject) => {
      const messageData = {
        recipientId: recipientId,
        userId: userId,
        username: user.username,
        profilePicture: user.profile?.picture,
        message: message.trim()
      };

      const timeout = setTimeout(() => {
        reject(new Error('Message sending timeout'));
      }, 5000);

      socket.emit('send_private_message', messageData, (response) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send private message'));
        }
      });
    });
  }, [socket, isConnected, user, getUserId, checkIfBlocked]);

  // Load private chat history
  const loadPrivateMessages = useCallback(async (recipientId) => {
    if (!socket || !isConnected) {
      throw new Error('Not connected to chat server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Load messages timeout'));
      }, 15000); // ✅ CHANGED: Increased to 15 seconds

      socket.emit('load_private_messages', { recipientId }, (response) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to load messages'));
        }
      });
    });
  }, [socket, isConnected]);

  // Load user conversations
  const loadConversations = useCallback(async () => {
    if (!socket || !isConnected) {
      throw new Error('Not connected to chat server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Load conversations timeout'));
      }, 5000);

      socket.emit('load_conversations', (response) => {
        clearTimeout(timeout);
        if (response?.success) {
          setConversations(response.conversations || []);
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to load conversations'));
        }
      });
    });
  }, [socket, isConnected]);

  // Start typing indicator
  const startTyping = useCallback((quizId) => {
    if (socket && isConnected && quizId) {
      socket.emit('typing_start', {
        quizId,
        username: user.username
      });
    }
  }, [socket, isConnected, user]);

  // Stop typing indicator
  const stopTyping = useCallback((quizId) => {
    if (socket && isConnected && quizId) {
      socket.emit('typing_stop', {
        quizId,
        username: user.username
      });
    }
  }, [socket, isConnected, user]);

  // Subscribe to new messages
  const subscribeToMessages = useCallback((callback) => {
    if (!socket) {
      console.warn('⚠️ Cannot subscribe: No socket available');
      return () => {};
    }
    
    console.log('📩 Adding message listener');
    socket.on('receive_message', callback);
    socket.on('receive_private_message', callback);
    
    return () => {
      console.log('📩 Removing message listener');
      socket.off('receive_message', callback);
      socket.off('receive_private_message', callback);
    };
  }, [socket]);

  const unsubscribeFromMessages = useCallback((callback) => {
    if (!socket) return;
    console.log('📩 Unsubscribing message listener');
    socket.off('receive_message', callback);
    socket.off('receive_private_message', callback);
  }, [socket]);

  // Get messages for a quiz
  const getQuizMessages = useCallback((quizId) => {
    return messages[quizId] || [];
  }, [messages]);

// NEW: Block user via socket
const blockUser = useCallback(async (userId) => {
  if (!socket || !isConnected) {
    throw new Error('Not connected to chat server');
  }

  return new Promise((resolve, reject) => {
    socket.emit('block_user', { userId }, (response) => {
      if (response?.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || 'Failed to block user'));
      }
    });
  });
}, [socket, isConnected]);

// NEW: Unblock user via socket
const unblockUser = useCallback(async (userId) => {
  if (!socket || !isConnected) {
    throw new Error('Not connected to chat server');
  }

  return new Promise((resolve, reject) => {
    socket.emit('unblock_user', { userId }, (response) => {
      if (response?.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || 'Failed to unblock user'));
      }
    });
  });
}, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    conversations,
    joinQuizRoom,
    joinPrivateChat,
    sendMessage,
    sendPrivateMessage,
    loadPrivateMessages,
    loadConversations,
    startTyping,
    stopTyping,
    getQuizMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    // NEW: Blocking functions
    blockUser,
    unblockUser,
    checkIfBlocked
  };

  console.log('🎯 SocketContext value:', { 
    isConnected, 
    onlineUsersCount: onlineUsers.length,
    conversationsCount: conversations.length,
    userId: getUserId()
  });

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};