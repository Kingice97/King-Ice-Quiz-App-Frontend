import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext'; // FIXED: Added theme context
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';
import Loading from '../../components/common/Loading/Loading';
import OnlineUsers from '../../components/Chat/OnlineUsers/OnlineUsers';
import ChatRoom from '../../components/Chat/ChatRoom/ChatRoom';
import UserSearch from '../../components/Chat/UserSearch/UserSearch';
import ChatsList from '../../components/Chat/ChatsList/ChatsList';
import './Chat.css';

const Chat = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { onlineUsers, isConnected, joinQuizRoom, socket } = useSocket();
  const { isDark, toggleTheme } = useTheme(); // FIXED: Added theme toggle
  
  const [activeTab, setActiveTab] = useState('chats');
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);

  // Get consistent user ID
  const getUserId = () => {
    if (!user) return null;
    return user._id || user.id;
  };

  // Load conversations with retry logic for rate limiting
  const loadUserConversations = async (retryCount = 0) => {
    const userId = getUserId();
    if (!userId) {
      console.error('❌ Cannot load conversations: No user ID found');
      setConversationsError('User not properly authenticated');
      setConversationsLoading(false);
      return;
    }
    
    try {
      setConversationsLoading(true);
      setConversationsError(null);
      
      console.log(`💬 Loading conversations for user: ${userId}`);
      const response = await chatService.getUserConversations();
      
      if (response.success) {
        setConversations(response.data || []);
        console.log(`✅ Loaded ${response.data?.length || 0} conversations`);
      } else {
        setConversations([]);
        setConversationsError(response.message || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      
      // Handle rate limiting with retry
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`🔄 Rate limited (429), retrying in ${delay}ms... (Attempt ${retryCount + 1}/3)`);
        
        setTimeout(() => {
          loadUserConversations(retryCount + 1);
        }, delay);
        return;
      }
      
      setConversations([]);
      if (error.response?.status === 429) {
        setConversationsError('Too many requests. Please wait a moment and try again.');
      } else {
        setConversationsError(error.message || 'Failed to load conversations');
      }
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserConversations();
    }
  }, [isAuthenticated, user]);

  // Listen for conversation updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdate = (updatedConversation) => {
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv._id === updatedConversation._id);
        
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = updatedConversation;
          // Move to top
          const [moved] = updated.splice(existingIndex, 1);
          return [moved, ...updated];
        } else {
          // Add new conversation
          return [updatedConversation, ...prev];
        }
      });
    };

    socket.on('conversation_updated', handleConversationUpdate);

    return () => {
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket]);

  // Load online users
  useEffect(() => {
    const loadOnlineUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getOnlineUsers();
        setOnlineUsersList(response.data || []);
      } catch (error) {
        console.error('Failed to load online users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && getUserId()) {
      loadOnlineUsers();
    }
  }, [user]);

  // Update online users from socket
  useEffect(() => {
    if (onlineUsers.length > 0) {
      setOnlineUsersList(onlineUsers);
    }
  }, [onlineUsers]);

  const handleUserSelect = React.useCallback((selectedUser) => {
    const currentUserId = getUserId();
    const selectedUserId = selectedUser?._id || selectedUser?.id;
    
    if (!currentUserId || !selectedUserId) {
      console.error('❌ Cannot create private chat: Missing user IDs');
      return;
    }

    const userIds = [currentUserId, selectedUserId].sort();
    const roomId = `private_${userIds[0]}_${userIds[1]}`;
    
    setSelectedRoom({
      type: 'private',
      id: roomId,
      name: selectedUser.username,
      user: selectedUser,
      isPrivate: true
    });
  }, [user]);

  const handleConversationSelect = React.useCallback((conversation) => {
    const currentUserId = getUserId();
    const otherParticipant = conversation.participants.find(
      participant => (participant._id || participant.id) !== currentUserId
    );
    
    if (!otherParticipant) {
      console.error('❌ No other participant found in conversation');
      return;
    }

    setSelectedRoom({
      type: 'private',
      id: conversation._id,
      name: otherParticipant.username,
      user: otherParticipant,
      conversation: conversation,
      isPrivate: true
    });
  }, [user]);

  const handleGlobalChat = React.useCallback(() => {
    setSelectedRoom({
      type: 'global',
      id: 'global_chat',
      name: 'Global Chat',
      isPrivate: false
    });
    
    if (isConnected) {
      joinQuizRoom('global_chat');
    }
  }, [isConnected, joinQuizRoom]);

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  const handleBackToChats = React.useCallback(() => {
    setSelectedRoom(null);
  }, []);

  // Refresh conversations with retry
  const handleRefreshConversations = async () => {
    await loadUserConversations();
  };

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="chat-page">
        <div className="chat-container">
          <Loading text="Checking authentication..." />
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="chat-page">
        <div className="chat-container">
          <div className="auth-error">
            <h2>Authentication Required</h2>
            <p>Please log in to access the chat.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="btn btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <Helmet>
        <title>Chat - King Ice Quiz App</title>
        <meta name="description" content="Chat with other users on King Ice Quiz App" />
      </Helmet>

      <div className="chat-container">
        {/* Sidebar - Always visible on desktop */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h2>Chats</h2>
            <div className="header-actions">
              {/* FIXED: Added theme toggle to chat */}
              <button 
                className="chat-theme-toggle"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Online' : '🔴 Offline'}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
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
              Online ({onlineUsersList.length})
            </button>
            <button
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Find Users
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'chats' && (
              <ChatsList
                conversations={conversations}
                onConversationSelect={handleConversationSelect}
                loading={conversationsLoading}
                currentUser={user}
                onRefresh={handleRefreshConversations}
                error={conversationsError}
              />
            )}

            {activeTab === 'global' && (
              <div className="global-chat-section">
                <div className="section-header">
                  <h3>Global Chat</h3>
                  <p>Chat with everyone</p>
                </div>
                <button
                  onClick={handleGlobalChat}
                  className="btn btn-primary btn-block"
                  disabled={!isConnected}
                >
                  {isConnected ? 'Join Global Chat' : 'Connecting...'}
                </button>
              </div>
            )}

            {activeTab === 'online' && (
              <OnlineUsers
                users={onlineUsersList}
                onUserSelect={handleUserSelect}
                loading={loading}
                currentUserId={getUserId()}
              />
            )}

            {activeTab === 'search' && (
              <UserSearch
                onUserSelect={handleUserSelect}
                onSearchResults={handleSearchResults}
                currentUserId={getUserId()}
              />
            )}
          </div>

          {/* User Info Footer */}
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {user?.profile?.picture ? (
                  <img 
                    src={user.profile.picture}
                    alt={user.username}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-details">
                <div className="username">@{user?.username}</div>
                <div className="user-status">
                  {isConnected ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area - Shows chat or empty state */}
        <div className="chat-main">
          {selectedRoom ? (
            <ChatRoom
              room={selectedRoom}
              currentUser={user}
              onBack={handleBackToChats}
            />
          ) : (
            <div className="chat-empty-state">
              <div className="empty-state-content">
                <div className="empty-state-icon">💬</div>
                <h3>Your messages</h3>
                <p>Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;