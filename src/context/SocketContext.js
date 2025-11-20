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
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { user, isAuthenticated, serverStatus } = useAuth();

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

  // ✅ NEW: Improved socket connection with Render.com optimization
  const connectSocket = useCallback(() => {
    const userId = getUserId();
    
    console.log('🔄 SocketProvider: Checking connection conditions', {
      isAuthenticated,
      hasUser: !!user,
      userId: userId,
      userObject: user,
      serverStatus: serverStatus,
      connectionAttempts: connectionAttempts
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

    // ✅ FIXED: Don't attempt connection if server is offline
    if (serverStatus === 'offline') {
      console.log('🌐 Server is offline - delaying socket connection');
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

    const API_URL = process.env.REACT_APP_API_URL || 'https://king-ice-quiz-app.onrender.com';
    console.log('🔗 Connecting to:', API_URL);

    // ✅ FIXED: Better configuration for Render.com free tier
    const newSocket = io(API_URL, {
      auth: {
        userId: userId,
        username: user.username
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3, // Reduced for Render.com
      reconnectionDelay: 5000, // 5 seconds between attempts
      reconnectionDelayMax: 15000, // Max 15 seconds
      timeout: 45000, // Increased to 45 seconds for Render spin-up
      forceNew: true,
      withCredentials: true
    });

    setSocket(newSocket);
    setConnectionAttempts(prev => prev + 1);

    // Connection events with better Render.com handling
    newSocket.on('connect', () => {
      console.log('✅ SOCKET CONNECTED! ID:', newSocket.id);
      setIsConnected(true);
      setConnectionAttempts(0); // Reset attempts on successful connection
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
      setIsConnected(false);
      
      // Handle Render.com specific disconnection reasons
      if (reason === 'transport close' || reason === 'ping timeout') {
        console.log('🔄 Render.com might be spinning down, waiting 10 seconds...');
        setTimeout(() => {
          if (newSocket && !newSocket.connected) {
            console.log('🔄 Attempting reconnection after Render.com delay...');
            newSocket.connect();
          }
        }, 10000);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
      
      // Handle Render.com spin-up delays specifically
      if (error.message.includes('timeout') || error.message.includes('xhr poll error')) {
        console.log('⏰ Render.com is spinning up, waiting longer before retry...');
        
        // Progressive backoff based on connection attempts
        const delay = Math.min(connectionAttempts * 5000, 30000); // Max 30 seconds
        
        setTimeout(() => {
          if (newSocket && !newSocket.connected && connectionAttempts < 3) {
            console.log(`🔄 Retry attempt ${connectionAttempts + 1} after ${delay}ms delay`);
            newSocket.connect();
          } else if (connectionAttempts >= 3) {
            console.log('🚫 Max connection attempts reached, giving up');
          }
        }, delay);
      } else {
        // Regular reconnection for other errors
        setTimeout(() => {
          if (newSocket && !newSocket.connected && connectionAttempts < 2) {
            newSocket.connect();
          }
        }, 5000);
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionAttempts(0);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed - giving up');
      setConnectionAttempts(0);
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
    newSocket.on('receive_private_message', (messageData) => {
      console.log('📩 Received private message:', messageData);
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

  }, [isAuthenticated, user, getUserId, socket, serverStatus, connectionAttempts]);

  // Initialize socket connection with better timing
  useEffect(() => {
    // Delay connection attempt to allow server to spin up
    const connectionTimer = setTimeout(() => {
      connectSocket();
    }, 2000); // Wait 2 seconds before attempting connection

    return () => {
      clearTimeout(connectionTimer);
    };
  }, [connectSocket]);

  // ✅ NEW: Reconnect when server status changes to online
  useEffect(() => {
    if (serverStatus === 'online' && !isConnected && socket) {
      console.log('🌐 Server is back online, attempting socket reconnection...');
      const reconnectTimer = setTimeout(() => {
        if (socket && !socket.connected) {
          socket.connect();
        }
      }, 3000); // Wait 3 seconds after server comes online
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [serverStatus, isConnected, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 SocketProvider cleanup - disconnecting socket');
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

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
        reject(new Error('Message timeout - server may be spinning up'));
      }, 15000); // 15 seconds for message sending

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

    return new Promise((resolve, reject) => {
      const messageData = {
        recipientId: recipientId,
        userId: userId,
        username: user.username,
        profilePicture: user.profile?.picture,
        message: message.trim()
      };

      const timeout = setTimeout(() => {
        reject(new Error('Message sending timeout - server may be spinning up'));
      }, 15000);

      socket.emit('send_private_message', messageData, (response) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send private message'));
        }
      });
    });
  }, [socket, isConnected, user, getUserId]);

  // Load private chat history with better error handling
  const loadPrivateMessages = useCallback(async (recipientId) => {
    if (!socket || !isConnected) {
      // Try to use HTTP API as fallback when socket is not connected
      try {
        console.log('🔄 Socket not connected, trying HTTP API for messages...');
        const chatService = await import('../services/chatService');
        const response = await chatService.chatService.getPrivateMessages(recipientId, 50);
        return response;
      } catch (error) {
        throw new Error('Not connected to chat server and HTTP fallback failed');
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Load messages timeout - server may be spinning up'));
      }, 20000); // 20 seconds for loading messages

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
      // Try HTTP API fallback
      try {
        console.log('🔄 Socket not connected, trying HTTP API for conversations...');
        const chatService = await import('../services/chatService');
        const response = await chatService.chatService.getUserConversations();
        return response;
      } catch (error) {
        throw new Error('Not connected to chat server and HTTP fallback failed');
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Load conversations timeout - server may be spinning up'));
      }, 20000);

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

  // ✅ NEW: Manual reconnect function
  const reconnect = useCallback(() => {
    if (socket) {
      console.log('🔄 Manual reconnect triggered');
      setConnectionAttempts(0); // Reset attempts
      socket.connect();
    } else {
      console.log('🔄 No socket instance, creating new connection');
      connectSocket();
    }
  }, [socket, connectSocket]);

  // ✅ NEW: Get connection status with more details
  const getConnectionStatus = useCallback(() => {
    return {
      isConnected,
      connectionAttempts,
      serverStatus,
      hasSocket: !!socket,
      socketId: socket?.id
    };
  }, [isConnected, connectionAttempts, serverStatus, socket]);

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
    reconnect, // ✅ NEW: Manual reconnect
    getConnectionStatus, // ✅ NEW: Detailed status
    connectionAttempts // ✅ NEW: Connection attempts count
  };

  console.log('🎯 SocketContext value:', { 
    isConnected, 
    onlineUsersCount: onlineUsers.length,
    conversationsCount: conversations.length,
    userId: getUserId(),
    connectionAttempts,
    serverStatus
  });

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};