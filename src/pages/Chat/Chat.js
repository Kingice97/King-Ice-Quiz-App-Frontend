import React, { useState, useEffect, useRef, useCallback } from 'react'; // ✅ Added useRef import
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';
import { sendChatNotification } from '../../services/notificationService';
import Loading from '../../components/common/Loading/Loading';
import OnlineUsers from '../../components/Chat/OnlineUsers/OnlineUsers';
import ChatRoom from '../../components/Chat/ChatRoom/ChatRoom';
import UserSearch from '../../components/Chat/UserSearch/UserSearch';
import ChatsList from '../../components/Chat/ChatsList/ChatsList';
import './Chat.css';

const Chat = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { onlineUsers, isConnected, joinQuizRoom, socket, subscribeToMessages, unsubscribeFromMessages } = useSocket();
  
  const [activeTab, setActiveTab] = useState('chats');
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);
  const lastNotificationRef = useRef(null); // Track last notification to avoid duplicates

  // Get consistent user ID
  const getUserId = () => {
    if (!user) return null;
    return user._id || user.id;
  };

  // ✅ FIXED: Improved background notification handler
  const handleBackgroundNotification = useCallback((message) => {
    // Only handle private messages when not in chat room
    if (selectedRoom || message.type !== 'private') return;

    console.log('🔔 Background notification check for message:', message);
    
    // Don't send notification if:
    // 1. It's our own message
    const isOwnMessage = message.user === getUserId();
    // 2. We've already notified for this message
    const isDuplicate = lastNotificationRef.current === message._id;
    // 3. App is in foreground
    const isAppInBackground = document.visibilityState === 'hidden';

    console.log('📱 Notification conditions:', {
      isOwnMessage,
      isDuplicate,
      isAppInBackground,
      messageId: message._id
    });

    if (!isOwnMessage && !isDuplicate && isAppInBackground) {
      console.log('📱 Sending background notification');
      lastNotificationRef.current = message._id;
      
      // Use service worker for better background notifications
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(`💬 ${message.username}`, {
            body: message.message.length > 100 ? 
                  message.message.substring(0, 100) + '...' : 
                  message.message,
            icon: '/brain-icon.png',
            badge: '/brain-icon.png',
            vibrate: [200, 100, 200],
            tag: `chat-${message.room}`,
            renotify: true,
            data: {
              url: `/chat`,
              type: 'chat',
              roomId: message.room,
              sender: message.username,
              timestamp: message.timestamp
            },
            actions: [
              {
                action: 'open',
                title: '💬 Open Chat'
              },
              {
                action: 'dismiss',
                title: '❌ Dismiss'
              }
            ]
          });
        }).catch(error => {
          console.error('❌ Service Worker notification failed:', error);
          // Fallback to regular notification
          sendChatNotification(message.username, message.message);
        });
      } else {
        // Fallback
        sendChatNotification(message.username, message.message);
      }
    }
  }, [selectedRoom]);

  // ✅ NEW: Listen for new private messages when not in chat room
  useEffect(() => {
    if (!socket) return;

    console.log('🎯 Setting up background message listener');

    const handleNewPrivateMessage = (message) => {
      // Only handle private messages
      if (message.type === 'private' && message.room && message.room.includes('private')) {
        console.log('📩 Background message received:', message);
        handleBackgroundNotification(message);
      }
    };

    subscribeToMessages(handleNewPrivateMessage);

    return () => {
      console.log('🔴 Removing background message listener');
      unsubscribeFromMessages(handleNewPrivateMessage);
    };
  }, [socket, selectedRoom, subscribeToMessages, unsubscribeFromMessages, handleBackgroundNotification]);

  // Load conversations
  useEffect(() => {
    const loadUserConversations = async () => {
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
        
        const response = await chatService.getUserConversations();
        
        if (response.success) {
          setConversations(response.data || []);
        } else {
          setConversations([]);
          setConversationsError(response.message || 'Failed to load conversations');
        }
      } catch (error) {
        console.error('❌ Failed to load conversations:', error);
        setConversations([]);
        setConversationsError(error.message || 'Failed to load conversations');
      } finally {
        setConversationsLoading(false);
      }
    };

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

      // ✅ FIXED: Send notification for new conversations with unread messages
      if (updatedConversation.unreadCount > 0 && document.visibilityState === 'hidden') {
        const otherParticipant = updatedConversation.participants.find(
          participant => (participant._id || participant.id) !== getUserId()
        );
        
        if (otherParticipant && !selectedRoom) {
          console.log('🔔 New conversation with unread messages');
          
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(`💬 ${otherParticipant.username}`, {
                body: 'You have new unread messages',
                icon: '/brain-icon.png',
                badge: '/brain-icon.png',
                vibrate: [200, 100, 200],
                tag: `conversation-${updatedConversation._id}`,
                data: {
                  url: `/chat`,
                  type: 'chat',
                  conversationId: updatedConversation._id
                }
              });
            });
          }
        }
      }
    };

    socket.on('conversation_updated', handleConversationUpdate);

    return () => {
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket, selectedRoom]);

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

  // Handle user selection for private chat
  const handleUserSelect = (selectedUser) => {
    const currentUserId = getUserId();
    const selectedUserId = selectedUser?._id || selectedUser?.id;
    
    if (!currentUserId || !selectedUserId) {
      console.error('❌ Cannot create private chat: Missing user IDs');
      return;
    }

    // Create consistent room ID by sorting user IDs alphabetically
    const userIds = [currentUserId, selectedUserId].sort();
    const roomId = `private_${userIds[0]}_${userIds[1]}`;
    
    setSelectedRoom({
      type: 'private',
      id: roomId,
      name: selectedUser.username,
      user: selectedUser,
      isPrivate: true
    });
    setActiveTab('chat');
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
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
    setActiveTab('chat');
  };

  const handleGlobalChat = () => {
    setSelectedRoom({
      type: 'global',
      id: 'global_chat',
      name: 'Global Chat',
      isPrivate: false
    });
    setActiveTab('chat');
    
    // Join the global chat room via socket
    if (isConnected) {
      joinQuizRoom('global_chat');
    }
  };

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  const handleBackToChats = () => {
    setSelectedRoom(null);
    setActiveTab('chats');
  };

  // Refresh conversations
  const handleRefreshConversations = async () => {
    try {
      setConversationsLoading(true);
      setConversationsError(null);
      
      const response = await chatService.getUserConversations();
      
      if (response.success) {
        setConversations(response.data || []);
      } else {
        setConversationsError(response.message || 'Failed to refresh conversations');
      }
    } catch (error) {
      console.error('❌ Failed to refresh conversations:', error);
      setConversationsError(error.message || 'Failed to refresh conversations');
    } finally {
      setConversationsLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <Helmet>
        <title>Chat - King Ice Quiz App</title>
        <meta name="description" content="Chat with other users on King Ice Quiz App" />
      </Helmet>

      <div className="chat-container">
        {/* Sidebar */}
        {!selectedRoom && (
          <div className="chat-sidebar">
            <div className="sidebar-header">
              <h2>Chat</h2>
              <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Online' : '🔴 Offline'}
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
                Global Chat
              </button>
              <button
                className={`tab ${activeTab === 'online' ? 'active' : ''}`}
                onClick={() => setActiveTab('online')}
              >
                Online Users ({onlineUsersList.length})
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
                    <p>Chat with everyone in the community</p>
                  </div>
                  <button
                    onClick={handleGlobalChat}
                    className="btn btn-primary btn-block"
                    disabled={!isConnected}
                  >
                    {isConnected ? 'Join Global Chat' : 'Connecting...'}
                  </button>
                  
                  {!isConnected && (
                    <div className="connection-help">
                      <p>Having trouble connecting? Try refreshing the page.</p>
                    </div>
                  )}
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
        )}

        {/* Main Chat Area */}
        <div className={`chat-main ${selectedRoom ? 'expanded' : ''}`}>
          {selectedRoom ? (
            <ChatRoom
              room={selectedRoom}
              currentUser={user}
              onBack={handleBackToChats}
            />
          ) : (
            <div className="chat-welcome">
              <div className="welcome-content">
                <h1>Welcome to Chat, {user?.username}!</h1>
                <p>
                  {isConnected 
                    ? 'Select a conversation or start a new chat' 
                    : 'Connecting to chat server...'
                  }
                </p>
                <div className="chat-stats">
                  <div className="stat-item">
                    <div className="stat-value">{conversations.length}</div>
                    <div className="stat-label">Conversations</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{onlineUsersList.length}</div>
                    <div className="stat-label">Users Online</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {isConnected ? '🟢' : '🔴'}
                    </div>
                    <div className="stat-label">
                      {isConnected ? 'Connected' : 'Connecting'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{user?.stats?.messagesSent || 0}</div>
                    <div className="stat-label">Your Messages</div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                {isConnected && (
                  <div className="quick-actions">
                    <button
                      onClick={() => setActiveTab('search')}
                      className="btn btn-primary btn-large"
                    >
                      Start New Chat
                    </button>
                    <button
                      onClick={handleGlobalChat}
                      className="btn btn-outline btn-large"
                    >
                      Join Global Chat
                    </button>
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