import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import ChatsList from '../../components/Chat/ChatList/ChatList';
import GlobalChat from '../../components/Chat/GlobalChat/GlobalChat';
import OnlineUsers from '../../components/Chat/OnlineUsers/OnlineUsers';
import UserSearch from '../../components/Chat/UserSearch/UserSearch';
import ChatRoom from '../../components/Chat/ChatRoom/ChatRoom';
import Loading from '../../components/common/Loading/Loading';
import { useTheme } from '../../context/ThemeContext';
import './Chat.css';

const Chat = () => {
  const { user: currentUser } = useAuth();
  const { isConnected, socket } = useSocket();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('chats');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [globalMessages, setGlobalMessages] = useState([]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      console.log('📥 Loading conversations...');
      
      const response = await chatService.getUserConversations();
      
      if (response.success) {
        console.log('✅ Conversations loaded:', response.data.length);
        setConversations(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      setError(error.message || 'Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load online users
  const loadOnlineUsers = useCallback(async () => {
    try {
      const response = await userService.getOnlineUsers();
      if (response.success) {
        setOnlineUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error loading online users:', error);
      setOnlineUsers([]);
    }
  }, []);

  // Load global messages
  const loadGlobalMessages = useCallback(async () => {
    try {
      const response = await chatService.getGlobalMessages(50);
      if (response.success) {
        setGlobalMessages(response.data || []);
      }
    } catch (error) {
      console.error('Error loading global messages:', error);
      setGlobalMessages([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (currentUser) {
      loadConversations();
      loadOnlineUsers();
      loadGlobalMessages();
    }
  }, [currentUser, loadConversations, loadOnlineUsers, loadGlobalMessages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Listen for new messages to update conversation list
    const handleNewMessage = (message) => {
      console.log('💬 New message received in chat:', message);
      
      if (message.type === 'private') {
        // Update conversations list with new message
        setConversations(prev => {
          const existingConvIndex = prev.findIndex(conv => 
            conv._id === message.conversation
          );
          
          if (existingConvIndex >= 0) {
            // Update existing conversation
            const updated = [...prev];
            updated[existingConvIndex] = {
              ...updated[existingConvIndex],
              lastMessage: message,
              lastMessageAt: message.timestamp
            };
            // Move to top
            const movedConv = updated.splice(existingConvIndex, 1)[0];
            return [movedConv, ...updated];
          } else {
            // This is a new conversation - reload conversations
            loadConversations();
            return prev;
          }
        });
      }
    };

    // Listen for user online/offline status
    const handleUserOnline = (userData) => {
      setOnlineUsers(prev => {
        const existing = prev.find(u => u._id === userData._id);
        if (existing) {
          return prev.map(u => u._id === userData._id ? { ...u, isOnline: true } : u);
        } else {
          return [...prev, { ...userData, isOnline: true }];
        }
      });
    };

    const handleUserOffline = (userId) => {
      setOnlineUsers(prev => 
        prev.map(u => u._id === userId ? { ...u, isOnline: false } : u)
      );
    };

    // Listen for conversation updates
    const handleConversationUpdate = (conversation) => {
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c._id === conversation._id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = conversation;
          return updated;
        }
        return prev;
      });
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('conversationUpdated', handleConversationUpdate);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('conversationUpdated', handleConversationUpdate);
    };
  }, [socket, currentUser, loadConversations]);

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    console.log('💬 Selecting conversation:', conversation);
    setSelectedConversation(conversation);
    
    // On mobile, open the chat room
    if (window.innerWidth <= 768) {
      setMobileChatOpen(true);
    }
  };

  // Handle back from chat room
  const handleBackFromChat = () => {
    setSelectedConversation(null);
    setMobileChatOpen(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadConversations();
    if (activeTab === 'online') {
      loadOnlineUsers();
    } else if (activeTab === 'global') {
      loadGlobalMessages();
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <ChatsList
            conversations={conversations}
            onConversationSelect={handleConversationSelect}
            loading={loading}
            currentUser={currentUser}
            onRefresh={loadConversations}
            error={error}
          />
        );
      
      case 'global':
        return (
          <GlobalChat
            messages={globalMessages}
            currentUser={currentUser}
            onRefresh={loadGlobalMessages}
          />
        );
      
      case 'online':
        return (
          <OnlineUsers
            users={onlineUsers}
            currentUser={currentUser}
            onUserSelect={handleConversationSelect}
            onRefresh={loadOnlineUsers}
          />
        );
      
      case 'find':
        return (
          <UserSearch
            currentUser={currentUser}
            onUserSelect={handleConversationSelect}
          />
        );
      
      default:
        return null;
    }
  };

  // Show loading if no user
  if (!currentUser) {
    return (
      <div className="chat-page">
        <div className="chat-container">
          <div className="auth-error">
            <h2>Authentication Required</h2>
            <p>Please log in to access the chat feature.</p>
          </div>
        </div>
      </div>
    );
  }

  const containerClass = `chat-container ${mobileChatOpen ? 'mobile-chat-open' : ''}`;

  return (
    <div className="chat-page">
      <div className={containerClass}>
        {/* Sidebar */}
        <div className="chat-sidebar">
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <h2>Chat</h2>
            <div className="header-actions">
              <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <button 
                className="chat-theme-toggle"
                onClick={toggleTheme}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="chat-tabs">
            <button 
              className={`tab ${activeTab === 'chats' ? 'active' : ''}`}
              onClick={() => setActiveTab('chats')}
            >
              Chats
              {conversations.length > 0 && (
                <span className="tab-badge">{conversations.length}</span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === 'global' ? 'active' : ''}`}
              onClick={() => setActiveTab('global')}
            >
              Global
            </button>
            <button 
              className={`tab ${activeTab === 'online' ? 'active' : ''}`}
              onClick={() => setActiveTab('online')}
            >
              Online
              {onlineUsers.length > 0 && (
                <span className="tab-badge">{onlineUsers.length}</span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === 'find' ? 'active' : ''}`}
              onClick={() => setActiveTab('find')}
            >
              Find Users
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {renderTabContent()}
          </div>

          {/* REMOVED: Sidebar Footer with user profile */}
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {selectedConversation ? (
            <ChatRoom 
              room={{
                ...selectedConversation,
                type: 'private',
                name: selectedConversation.participants?.find(p => 
                  (p._id || p.id) !== (currentUser._id || currentUser.id)
                )?.username || 'Unknown User',
                user: selectedConversation.participants?.find(p => 
                  (p._id || p.id) !== (currentUser._id || currentUser.id)
                )
              }}
              currentUser={currentUser}
              onBack={handleBackFromChat}
            />
          ) : (
            <div className="chat-empty-state">
              <div className="empty-state-content">
                <div className="empty-state-icon">💬</div>
                <h3>Welcome to King Ice Quiz Chat</h3>
                <p>Select a conversation from the sidebar to start chatting, or find new users to connect with.</p>
                
                {!isConnected && (
                  <div className="connection-help">
                    <p><strong>Connection Issue:</strong> Please check your internet connection and try refreshing the page.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;