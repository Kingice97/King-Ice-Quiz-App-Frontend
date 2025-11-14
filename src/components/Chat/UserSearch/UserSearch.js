import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../../../services/userService';
import Loading from '../../common/Loading/Loading';
import './UserSearch.css';

const UserSearch = ({ onUserSelect, onSearchResults, currentUserId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ FIXED: Memoize the search results callback to prevent infinite loops
  const stableOnSearchResults = useCallback(onSearchResults, []);
  
  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        setSearchPerformed(false);
        setError('');
        setLoading(false);
        stableOnSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        setSearchPerformed(true);
        
        console.log('🔍 Searching users with query:', query.trim());
        const response = await userService.searchUsers(query.trim());
        
        // Handle both success and error responses
        const userResults = response.success ? (response.data || []) : [];
        
        // Filter out current user from results
        const filteredResults = userResults.filter(user => {
          const userId = user._id || user.id;
          return userId !== currentUserId;
        });
        
        console.log('✅ Search results:', filteredResults);
        setResults(filteredResults);
        stableOnSearchResults(filteredResults);
        
        // Set error if search failed but we have a message
        if (!response.success && response.message) {
          setError(response.message);
        }
      } catch (error) {
        console.error('❌ Search failed:', error);
        setError('Failed to search users. Please try again.');
        setResults([]);
        stableOnSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const debounceTimer = setTimeout(searchUsers, 500);
    return () => {
      clearTimeout(debounceTimer);
      setLoading(false);
    };
  }, [query, currentUserId, stableOnSearchResults]); // ✅ Remove onSearchResults from dependencies

  // ✅ FIXED: Handle user selection with proper ID format
  const handleUserSelect = (user) => {
    console.log('👤 User selected:', user.username, user);
    
    // Ensure we pass the complete user object with both _id and id
    const userToSend = {
      ...user,
      // Make sure we have both _id and id for compatibility
      _id: user._id || user.id,
      id: user.id || user._id
    };
    
    onUserSelect(userToSend);
    setQuery('');
    setResults([]);
    setSearchPerformed(false);
    setError('');
    setLoading(false);
    stableOnSearchResults([]); // ✅ Use stable callback
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!e.target.value.trim()) {
      setError('');
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setSearchPerformed(false);
    setError('');
    setLoading(false);
    stableOnSearchResults([]); // ✅ Use stable callback
  };

  return (
    <div className="user-search">
      <div className="search-header">
        <h3>Find Users</h3>
        <p>Search by username or name to start a private chat</p>
      </div>

      <div className="search-input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search users by username or name..."
            className="search-input"
            disabled={loading}
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="clear-button"
              type="button"
              disabled={loading}
            >
              ✕
            </button>
          )}
        </div>
        
        {loading && (
          <div className="search-loading">
            <Loading size="small" text="Searching..." />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      <div className="search-results">
        {/* Search Results */}
        {searchPerformed && !loading && results.length === 0 && !error && (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <p>No users found for "{query}"</p>
            <p className="no-results-subtitle">Try searching with a different term</p>
          </div>
        )}

        {/* Search Results List */}
        {results.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h4>Search Results ({results.length})</h4>
            </div>
            <div className="results-list">
              {results.map(user => (
                <div
                  key={user._id || user.id}
                  className="user-result"
                  onClick={() => handleUserSelect(user)}
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
                  
                  <div className="select-indicator">
                    <span>Chat →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;