import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  
  // ✅ FIXED: Use refs to prevent unnecessary re-renders
  const connectionAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  // Get stable user ID - handles both id and _id formats
  const getUserId = useCallback(() => {
    if (!user) return null;
    return user._id || user.id;
  }, [user]);

  // ✅ FIXED: Stable socket connection function with minimal dependencies
  const connectSocket = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const userId = getUserId();
    
    console.log('🔄 SocketProvider: Checking connection conditions', {
      isAuthenticated,
      hasUser: !!user,
      userId: userId,
      serverStatus: serverStatus,
      connectionAttempts: connectionAttemptsRef.current
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

    // Don't attempt connection if server is offline
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

    // Socket.io configuration for Render.com
    const newSocket = io(API_URL, {
      auth: {
        userId: userId,
        username: user.username
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 15000,
      timeout: 45000,
      forceNew: true,
      withCredentials: true
    });

    setSocket(newSocket);
    connectionAttemptsRef.current += 1;
    setConnectionAttempts(connectionAttemptsRef.current);

    // Connection events
    const handleConnect = () => {
      if (!isMountedRef.current) return;
      console.log('✅ SOCKET CONNECTED! ID:', newSocket.id);
      setIsConnected(true);
      connectionAttemptsRef.current = 0;
      setConnectionAttempts(0);
    };

    const handleDisconnect = (reason) => {
      if (!isMountedRef.current) return;
      console.log('🔴 Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'transport close' || reason === 'ping timeout') {
        console.log('🔄 Render.com might be spinning down, waiting 10 seconds...');
        setTimeout(() => {
          if (isMountedRef.current && newSocket && !newSocket.connected) {
            console.log('🔄 Attempting reconnection after Render.com delay...');
            newSocket.connect();
          }
        }, 10000);
      }
    };

    const handleConnectError = (error) => {
      if (!isMountedRef.current) return;
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
      
      if (error.message.includes('timeout') || error.message.includes('xhr poll error')) {
        console.log('⏰ Render.com is spinning up, waiting longer before retry...');
        
        const delay = Math.min(connectionAttemptsRef.current * 5000, 30000);
        
        setTimeout(() => {
          if (isMountedRef.current && newSocket && !newSocket.connected && connectionAttemptsRef.current < 3) {
            console.log(`🔄 Retry attempt ${connectionAttemptsRef.current + 1} after ${delay}ms delay`);
            newSocket.connect();
          } else if (connectionAttemptsRef.current >= 3) {
            console.log('🚫 Max connection attempts reached, giving up');
          }
        }, delay);
      }
    };

    const handleReconnect = (attemptNumber) => {
      if (!isMountedRef.current) return;
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      connectionAttemptsRef.current = 0;
      setConnectionAttempts(0);
    };

    const handleConnectionSuccess = (data) => {
      if (!isMountedRef.current) return;
      console.log('✅ Server connection success:', data);
      setIsConnected(true);
    };

    const handleReceiveMessage = (messageData) => {
      if (!isMountedRef.current) return;
      console.log('📩 Received message:', messageData);
      setMessages(prev => {
        const roomId = messageData.quiz || messageData.quizId;
        const existing = prev[roomId] || [];
        
        if (existing.some(msg => msg._id === messageData._id)) {
          return prev;
        }
        
        return {
          ...prev,
          [roomId]: [...existing, messageData]
        };
      });
    };

    const handleReceivePrivateMessage = (messageData) => {
      if (!isMountedRef.current) return;
      console.log('📩 Received private message:', messageData);
      setMessages(prev => {
        const roomId = messageData.room;
        const existing = prev[roomId] || [];
        
        if (existing.some(msg => msg._id === messageData._id)) {
          return prev;
        }
        
        return {
          ...prev,
          [roomId]: [...existing, messageData]
        };
      });
    };

    const handleConversationUpdated = (conversationData) => {
      if (!isMountedRef.current) return;
      console.log('💬 Conversation updated:', conversationData);
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv._id === conversationData._id);
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = conversationData;
          const [moved] = updated.splice(existingIndex, 1);
          return [moved, ...updated];
        } else {
          return [conversationData, ...prev];
        }
      });
    };

    const handleOnlineUsersUpdate = (users) => {
      if (!isMountedRef.current) return;
      console.log('👥 Online users updated:', users.length);
      setOnlineUsers(users);
    };

    const handleUserTyping = (data) => {
      if (!isMountedRef.current) return;
      console.log('⌨️ Typing:', data);
      setTypingUsers(prev => ({
        ...prev,
        [data.quizId]: data.isTyping 
          ? [...new Set([...(prev[data.quizId] || []), data.username])]
          : (prev[data.quizId] || []).filter(u => u !== data.username)
      }));
    };

    // Attach event listeners
    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('connect_error', handleConnectError);
    newSocket.on('reconnect', handleReconnect);
    newSocket.on('connection_success', handleConnectionSuccess);
    newSocket.on('receive_message', handleReceiveMessage);
    newSocket.on('receive_private_message', handleReceivePrivateMessage);
    newSocket.on('conversation_updated', handleConversationUpdated);
    newSocket.on('online_users_update', handleOnlineUsersUpdate);
    newSocket.on('user_typing', handleUserTyping);

    // Store cleanup function on socket instance
    newSocket._cleanup = () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('connect_error', handleConnectError);
      newSocket.off('reconnect', handleReconnect);
      newSocket.off('connection_success', handleConnectionSuccess);
      newSocket.off('receive_message', handleReceiveMessage);
      newSocket.off('receive_private_message', handleReceivePrivateMessage);
      newSocket.off('conversation_updated', handleConversationUpdated);
      newSocket.off('online_users_update', handleOnlineUsersUpdate);
      newSocket.off('user_typing', handleUserTyping);
    };

  }, [isAuthenticated, user, serverStatus]); // ✅ FIXED: Minimal dependencies

  // ✅ FIXED: Single connection effect with proper cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    // Delay connection to allow auth to settle
    const connectionTimer = setTimeout(() => {
      if (isMountedRef.current) {
        connectSocket();
      }
    }, 2000);

    return () => {
      clearTimeout(connectionTimer);
    };
  }, [connectSocket]);

  // ✅ FIXED: Server status change handler
  useEffect(() => {
    if (serverStatus === 'online' && !isConnected && socket) {
      console.log('🌐 Server is back online, attempting socket reconnection...');
      const reconnectTimer = setTimeout(() => {
        if (isMountedRef.current && socket && !socket.connected) {
          socket.connect();
        }
      }, 3000);
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [serverStatus, isConnected, socket]);

  // ✅ FIXED: Proper cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 SocketProvider cleanup - disconnecting socket');
      isMountedRef.current = false;
      if (socket) {
        // Call stored cleanup function
        if (socket._cleanup) {
          socket._cleanup();
        }
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

  const joinPrivateChat = useCallback((recipientId) => {
    console.log(`🔐 Joining private chat with: ${recipientId}`);
    
    if (socket && isConnected && recipientId) {
      socket.emit('join_private_chat', recipientId);
    } else {
      console.warn('⚠️ Cannot join private chat: Socket not ready');
    }
  }, [socket, isConnected]);

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
      }, 15000);

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

  const loadPrivateMessages = useCallback(async (recipientId) => {
    if (!socket || !isConnected) {
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
      }, 20000);

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

  const loadConversations = useCallback(async () => {
    if (!socket || !isConnected) {
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

  const startTyping = useCallback((quizId) => {
    if (socket && isConnected && quizId) {
      socket.emit('typing_start', {
        quizId,
        username: user.username
      });
    }
  }, [socket, isConnected, user]);

  const stopTyping = useCallback((quizId) => {
    if (socket && isConnected && quizId) {
      socket.emit('typing_stop', {
        quizId,
        username: user.username
      });
    }
  }, [socket, isConnected, user]);

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

  const getQuizMessages = useCallback((quizId) => {
    return messages[quizId] || [];
  }, [messages]);

  const reconnect = useCallback(() => {
    if (socket) {
      console.log('🔄 Manual reconnect triggered');
      connectionAttemptsRef.current = 0;
      setConnectionAttempts(0);
      socket.connect();
    } else {
      console.log('🔄 No socket instance, creating new connection');
      connectSocket();
    }
  }, [socket, connectSocket]);

  const getConnectionStatus = useCallback(() => {
    return {
      isConnected,
      connectionAttempts: connectionAttemptsRef.current,
      serverStatus,
      hasSocket: !!socket,
      socketId: socket?.id
    };
  }, [isConnected, serverStatus, socket]);

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
    reconnect,
    getConnectionStatus,
    connectionAttempts: connectionAttemptsRef.current
  };

  console.log('🎯 SocketContext value:', { 
    isConnected, 
    onlineUsersCount: onlineUsers.length,
    conversationsCount: conversations.length,
    userId: getUserId(),
    connectionAttempts: connectionAttemptsRef.current,
    serverStatus
  });

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};