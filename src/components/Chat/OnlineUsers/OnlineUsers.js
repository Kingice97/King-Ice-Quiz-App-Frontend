import React from 'react';
import Loading from '../../common/Loading/Loading';
import './OnlineUsers.css';

const OnlineUsers = ({ users, onUserSelect, loading, currentUserId }) => {
  if (loading) {
    return <Loading text="Loading online users..." />;
  }

  if (users.length === 0) {
    return (
      <div className="no-users">
        <p>No users online at the moment</p>
        <p className="no-users-subtitle">Users will appear here when they come online</p>
      </div>
    );
  }

  return (
    <div className="online-users">
      <div className="users-header">
        <h3>Online Users</h3>
        <p>{users.length} user{users.length !== 1 ? 's' : ''} online</p>
      </div>

      <div className="users-list">
        {users.map(user => {
          // ✅ FIXED: Handle both _id and id formats
          const userId = user._id || user.id;
          const currentUserIdentifier = currentUserId;
          
          // Don't show current user in the list
          if (userId === currentUserIdentifier) return null;
          
          return (
            <div
              key={userId}
              className={`user-item ${userId === currentUserIdentifier ? 'current-user' : ''}`}
              onClick={() => {
                // ✅ FIXED: Pass user with both ID formats for compatibility
                const userToSend = {
                  ...user,
                  _id: user._id || user.id,
                  id: user.id || user._id
                };
                onUserSelect(userToSend);
              }}
            >
              <div className="user-avatar">
                {user.profile?.picture ? (
                  <img 
                    // Replace with:
                    src={user.profile.picture}
                    alt={user.username}
                    className="avatar-image"
                    onError={(e) => {
                      // If image fails to load, hide it
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`online-indicator ${user.isOnline ? 'online' : 'offline'}`}></div>
              </div>
              
              <div className="user-info">
                <div className="username">@{user.username}</div>
                {(user.profile?.firstName || user.profile?.lastName) && (
                  <div className="user-fullname">
                    {user.profile.firstName} {user.profile.lastName}
                  </div>
                )}
                <div className="user-status">
                  {user.isOnline ? '🟢 Online' : '🔴 Offline'}
                  {user.lastSeen && !user.isOnline && (
                    <span className="last-seen">
                      • Last seen {new Date(user.lastSeen).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              {user.role === 'admin' && (
                <div className="admin-badge" title="Administrator">
                  Admin
                </div>
              )}
              
              {userId === currentUserIdentifier && (
                <div className="current-user-badge" title="You">
                  You
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show message if only current user is online */}
      {users.filter(user => {
        const userId = user._id || user.id;
        return userId !== currentUserId;
      }).length === 0 && users.length > 0 && (
        <div className="only-you-online">
          <p>You're the only one online right now</p>
          <p className="subtitle">Invite friends to join the chat!</p>
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;