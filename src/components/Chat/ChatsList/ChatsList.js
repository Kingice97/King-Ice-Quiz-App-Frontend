import React from 'react';
import './ChatsList.css';

const ChatsList = ({ 
  conversations, 
  onConversationSelect, 
  loading, 
  currentUser,
  onRefresh,
  error 
}) => {
  
  const getOtherParticipant = (conversation) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    return conversation.participants.find(
      participant => (participant._id || participant.id) !== currentUserId
    );
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }
    
    const message = conversation.lastMessage.message;
    return message.length > 30 ? message.substring(0, 30) + '...' : message;
  };

  const getUnreadCount = (conversation) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    if (!conversation.unreadCount) return 0;
    
    // ✅ FIXED: Handle both Map and plain object formats
    if (conversation.unreadCount instanceof Map) {
      return conversation.unreadCount.get(currentUserId?.toString()) || 0;
    } else if (typeof conversation.unreadCount === 'object') {
      // Handle plain object format
      return conversation.unreadCount[currentUserId?.toString()] || 0;
    }
    
    return 0;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getProfilePicture = (participant) => {
    if (participant?.profile?.picture) {
      return `${process.env.REACT_APP_API_URL || 'https://king-ice-quiz-app.onrender.com'}${participant.profile.picture}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="chats-list">
        <div className="chats-header">
          <h3>Your Chats</h3>
          <button 
            className="refresh-btn" 
            onClick={onRefresh}
            disabled={true}
          >
            ↻
          </button>
        </div>
        <div className="loading-conversations">
          <div className="loading-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chats-list">
        <div className="chats-header">
          <h3>Your Chats</h3>
          <button 
            className="refresh-btn" 
            onClick={onRefresh}
          >
            ↻
          </button>
        </div>
        <div className="error-conversations">
          <div className="error-icon">⚠️</div>
          <h4>Error Loading Conversations</h4>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={onRefresh}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="chats-list">
        <div className="chats-header">
          <h3>Your Chats</h3>
          <button 
            className="refresh-btn" 
            onClick={onRefresh}
          >
            ↻
          </button>
        </div>
        <div className="no-conversations">
          <div className="no-chats-icon">💬</div>
          <h4>No conversations yet</h4>
          <p>Start a new chat by finding users or they will appear here when someone messages you.</p>
          <button className="btn btn-outline" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chats-list">
      <div className="chats-header">
        <h3>Your Chats</h3>
        <button 
          className="refresh-btn" 
          onClick={onRefresh}
          title="Refresh conversations"
        >
          ↻
        </button>
      </div>
      
      <div className="conversations-container">
        {conversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation);
          const unreadCount = getUnreadCount(conversation);
          const lastMessage = getLastMessagePreview(conversation);
          const lastMessageTime = formatTime(conversation.lastMessageAt);
          const profilePicture = getProfilePicture(otherParticipant);
          
          if (!otherParticipant) {
            console.warn('No other participant found in conversation:', conversation);
            return null;
          }

          return (
            <div
              key={conversation._id}
              className={`conversation-item ${unreadCount > 0 ? 'unread' : ''}`}
              onClick={() => onConversationSelect(conversation)}
            >
              <div className="conversation-avatar">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt={otherParticipant.username}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {otherParticipant.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                {otherParticipant.isOnline && (
                  <div className="online-indicator" title="Online"></div>
                )}
              </div>
              
              <div className="conversation-content">
                <div className="conversation-header">
                  <div className="conversation-username">
                    {otherParticipant.username}
                  </div>
                  <div className="conversation-time">
                    {lastMessageTime}
                  </div>
                </div>
                
                <div className="conversation-preview">
                  <span className="last-message">{lastMessage}</span>
                  {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatsList;