import React from 'react';
import { Helmet } from 'react-helmet-async';
import UserSearchComponent from '../../components/Chat/UserSearch/UserSearch';
import './UserSearch.css';

const UserSearch = () => {
  const handleUserSelect = (user) => {
    // Navigate to user profile or start chat
    console.log('Selected user:', user);
    // You can implement navigation logic here
  };

  const handleSearchResults = (results) => {
    console.log('Search results:', results);
  };

  return (
    <div className="user-search-page">
      <Helmet>
        <title>Find Users - King Ice Quiz</title>
        <meta name="description" content="Search for users to connect with on King Ice Quiz" />
      </Helmet>

      <div className="user-search-container">
        <div className="page-header">
          <h1>Find Users</h1>
          <p>Search for users to connect and chat with</p>
        </div>

        <div className="search-section">
          <UserSearchComponent
            onUserSelect={handleUserSelect}
            onSearchResults={handleSearchResults}
          />
        </div>

        <div className="search-tips-section">
          <h3>How to Connect</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">🔍</div>
              <h4>Search Users</h4>
              <p>Find users by username, first name, or last name</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">💬</div>
              <h4>Start Chat</h4>
              <p>Click on any user to start a private conversation</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">👥</div>
              <h4>Build Community</h4>
              <p>Connect with other quiz enthusiasts and learn together</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;