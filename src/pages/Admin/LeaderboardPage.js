import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useApi } from '../../hooks/useApi';
import { userService } from '../../services/userService';
import Loading from '../../components/common/Loading/Loading';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const [timeFilter, setTimeFilter] = useState('all'); // all, weekly, monthly
  const [limit, setLimit] = useState(20);

  const { data: leaderboardData, loading: leaderboardLoading } = useApi(() =>
    userService.getLeaderboard({ limit })
  );

  const leaderboard = leaderboardData?.data || [];

  // Filter by time period (you can enhance this with actual date filtering from backend)
  const filteredLeaderboard = leaderboard.filter(user => {
    if (timeFilter === 'all') return true;
    // Add date filtering logic here when your backend supports it
    return true;
  });

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#6B7280'; // Gray
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // FIXED: Safe date formatting function
  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  // FIXED: Get username from different possible field names
  const getUsername = (user) => {
    // Try different possible field names for username
    return user.username || user.user?.username || user.userName || 'Unknown User';
  };

  // FIXED: Get user object for avatar and other info
  const getUserObject = (user) => {
    return user.user || user;
  };

  return (
    <div className="leaderboard-page">
      <Helmet>
        <title>Leaderboard - Admin Dashboard</title>
      </Helmet>

      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>User Leaderboard</h1>
            <p>Top performers and quiz statistics</p>
          </div>
          <div className="header-stats">
            <span>Total Users: {leaderboard.length}</span>
            <span>
              Platform Average: {leaderboard.length > 0 
                ? Math.round(leaderboard.reduce((sum, user) => sum + (user.averageScore || 0), 0) / leaderboard.length)
                : 0
              }%
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="form-control"
            >
              <option value="all">All Time</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
            </select>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="form-control"
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard-section">
          {leaderboardLoading ? (
            <Loading text="Loading leaderboard..." />
          ) : (
            <>
              <div className="leaderboard-stats">
                <span>Showing: {filteredLeaderboard.length} users</span>
              </div>

              <div className="leaderboard-list">
                {filteredLeaderboard.map((user, index) => {
                  const userObj = getUserObject(user);
                  const username = getUsername(user);
                  
                  return (
                    <div key={user._id || index} className="leaderboard-item">
                      <div className="rank-section">
                        <div 
                          className="rank-badge"
                          style={{ backgroundColor: getRankColor(index + 1) }}
                        >
                          {getRankIcon(index + 1)}
                        </div>
                      </div>
                      
                      <div className="user-section">
                        <div className="user-avatar">
                          {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                          {/* FIXED: Use the correct username */}
                          <h3>{username}</h3>
                          <p>Joined {formatJoinDate(userObj.createdAt)}</p>
                          {userObj.role === 'admin' && (
                            <span className="admin-badge">Admin</span>
                          )}
                        </div>
                      </div>

                      <div className="stats-section">
                        <div className="stat">
                          <span className="stat-label">Quizzes Taken</span>
                          <span className="stat-value">{user.quizzesTaken || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Average Score</span>
                          <span className="stat-value">{Math.round(user.averageScore || 0)}%</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Best Score</span>
                          <span className="stat-value">{Math.round(user.bestScore || 0)}%</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Total Points</span>
                          <span className="stat-value">{user.totalPoints || 0}</span>
                        </div>
                      </div>

                      <div className="progress-section">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${Math.min(user.averageScore || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          Average Performance: {Math.round(user.averageScore || 0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredLeaderboard.length === 0 && (
                <div className="empty-state">
                  <p>No user data available yet.</p>
                  <p>Leaderboard will populate once users start taking quizzes.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;