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

  // DEBUG: Log the actual data structure
  console.log('🔍 Leaderboard Debug - Raw Data:', leaderboardData);
  
  // FIXED: Handle different possible data structures
  const leaderboard = React.useMemo(() => {
    if (!leaderboardData) return [];
    
    // Handle different response structures
    if (Array.isArray(leaderboardData.data)) {
      return leaderboardData.data;
    } else if (Array.isArray(leaderboardData)) {
      return leaderboardData;
    } else if (leaderboardData.leaderboard) {
      return leaderboardData.leaderboard;
    }
    
    return [];
  }, [leaderboardData]);

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

  // FIXED: Enhanced username extraction
  const getUsername = (user) => {
    // Try different possible field names for username
    if (user.username) return user.username;
    if (user.user?.username) return user.user.username;
    if (user.userName) return user.userName;
    if (user.user?.userName) return user.user.userName;
    if (user._id) return `User_${user._id.slice(-6)}`; // Fallback to user ID
    return 'Unknown User';
  };

  // FIXED: Enhanced user object extraction
  const getUserObject = (user) => {
    return user.user || user;
  };

  // FIXED: Enhanced stats extraction
  const getUserStats = (user) => {
    const userObj = getUserObject(user);
    
    return {
      quizzesTaken: user.quizzesTaken || userObj.quizzesTaken || user.stats?.quizzesTaken || 0,
      averageScore: user.averageScore || userObj.averageScore || user.stats?.averageScore || 0,
      bestScore: user.bestScore || userObj.bestScore || user.stats?.bestScore || 0,
      totalPoints: user.totalPoints || userObj.totalPoints || user.stats?.totalPoints || 0,
      createdAt: user.createdAt || userObj.createdAt,
      role: user.role || userObj.role
    };
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
                ? Math.round(leaderboard.reduce((sum, user) => {
                    const stats = getUserStats(user);
                    return sum + (stats.averageScore || 0);
                  }, 0) / leaderboard.length)
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
                {leaderboard.length === 0 && (
                  <div className="data-warning">
                    <small>No leaderboard data found. Check if users have taken quizzes.</small>
                  </div>
                )}
              </div>

              <div className="leaderboard-list">
                {filteredLeaderboard.map((user, index) => {
                  const username = getUsername(user);
                  const stats = getUserStats(user);
                  const userObj = getUserObject(user);
                  
                  return (
                    <div key={user._id || user.user?._id || index} className="leaderboard-item">
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
                          <h3>{username}</h3>
                          <p>Joined {formatJoinDate(stats.createdAt)}</p>
                          {stats.role === 'admin' && (
                            <span className="admin-badge">Admin</span>
                          )}
                        </div>
                      </div>

                      <div className="stats-section">
                        <div className="stat">
                          <span className="stat-label">Quizzes Taken</span>
                          <span className="stat-value">{stats.quizzesTaken}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Average Score</span>
                          <span className="stat-value">{Math.round(stats.averageScore)}%</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Best Score</span>
                          <span className="stat-value">{Math.round(stats.bestScore)}%</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Total Points</span>
                          <span className="stat-value">{stats.totalPoints}</span>
                        </div>
                      </div>

                      <div className="progress-section">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${Math.min(stats.averageScore, 100)}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          Average Performance: {Math.round(stats.averageScore)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredLeaderboard.length === 0 && !leaderboardLoading && (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No Leaderboard Data</h3>
                  <p>This could be because:</p>
                  <ul className="empty-reasons">
                    <li>No users have taken quizzes yet</li>
                    <li>The leaderboard API is returning empty data</li>
                    <li>There might be an issue with user stats calculation</li>
                  </ul>
                  <div className="empty-actions">
                    <button 
                      onClick={() => window.location.reload()} 
                      className="btn btn-primary"
                    >
                      Refresh Page
                    </button>
                  </div>
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