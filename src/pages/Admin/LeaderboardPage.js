import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useApi } from '../../hooks/useApi';
import { userService } from '../../services/userService';
import Loading from '../../components/common/Loading/Loading';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [limit, setLimit] = useState(20);

  // FIXED: Enhanced API call with error handling
  const { data: leaderboardData, loading: leaderboardLoading, error: leaderboardError } = useApi(() =>
    userService.getLeaderboard({ limit })
  );

  // DEBUG: Enhanced logging
  console.log('🔍 Leaderboard Debug - Raw Data:', leaderboardData);
  console.log('🔍 Leaderboard Debug - Loading:', leaderboardLoading);
  console.log('🔍 Leaderboard Debug - Error:', leaderboardError);

  // FIXED: Better data handling with error states
  const leaderboard = React.useMemo(() => {
    if (leaderboardError) {
      console.error('🚨 Leaderboard API error:', leaderboardError);
      return [];
    }
    
    if (!leaderboardData) return [];
    
    // Handle different response structures
    if (leaderboardData.success === false) {
      console.warn('⚠️ Leaderboard API returned error:', leaderboardData.message);
      return [];
    }
    
    if (Array.isArray(leaderboardData.data)) {
      return leaderboardData.data;
    } else if (Array.isArray(leaderboardData)) {
      return leaderboardData;
    } else if (leaderboardData.leaderboard) {
      return leaderboardData.leaderboard;
    }
    
    console.warn('⚠️ Unexpected leaderboard data structure:', leaderboardData);
    return [];
  }, [leaderboardData, leaderboardError]);

  // FIXED: Create mock data for testing if API fails
  const mockLeaderboard = [
    {
      _id: '1',
      username: 'Kingice7',
      quizzesTaken: 5,
      averageScore: 85,
      bestScore: 95,
      totalPoints: 425,
      createdAt: new Date().toISOString(),
      role: 'user'
    },
    {
      _id: '2', 
      username: 'asylumpupil',
      quizzesTaken: 3,
      averageScore: 72,
      bestScore: 88,
      totalPoints: 216,
      createdAt: new Date().toISOString(),
      role: 'user'
    }
  ];

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#6B7280';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getUsername = (user) => {
    return user.username || user.user?.username || user.userName || 'Unknown User';
  };

  const getUserObject = (user) => {
    return user.user || user;
  };

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

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      
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
      return 'Recently';
    }
  };

  // Determine which data to display
  const displayData = leaderboard.length > 0 ? leaderboard : mockLeaderboard;
  const isUsingMockData = leaderboard.length === 0 && !leaderboardLoading && !leaderboardError;

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
            <span>Total Users: {displayData.length}</span>
            {isUsingMockData && (
              <span className="mock-warning">⚠️ Using sample data</span>
            )}
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

        {/* Error Alert */}
        {leaderboardError && (
          <div className="error-alert">
            <h4>❌ Failed to load leaderboard</h4>
            <p>Error: {leaderboardError.message || 'Unknown error'}</p>
            <p>Showing sample data instead.</p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="leaderboard-section">
          {leaderboardLoading ? (
            <Loading text="Loading leaderboard..." />
          ) : (
            <>
              <div className="leaderboard-stats">
                <span>Showing: {displayData.length} users</span>
                {isUsingMockData && (
                  <div className="data-warning">
                    <small>
                      ⚠️ Leaderboard API is not returning data. Showing sample data. 
                      Check browser console for details.
                    </small>
                  </div>
                )}
              </div>

              <div className="leaderboard-list">
                {displayData.map((user, index) => {
                  const username = getUsername(user);
                  const stats = getUserStats(user);
                  
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
                          <h3>{username}</h3>
                          <p>Joined {formatJoinDate(stats.createdAt)}</p>
                          {stats.role === 'admin' && (
                            <span className="admin-badge">Admin</span>
                          )}
                          {isUsingMockData && (
                            <span className="mock-badge">Sample</span>
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

              {displayData.length === 0 && !leaderboardLoading && (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No Leaderboard Data Available</h3>
                  <p>The leaderboard API is not returning any data.</p>
                  <div className="troubleshooting">
                    <h4>Possible issues:</h4>
                    <ul>
                      <li>Backend leaderboard endpoint might be down</li>
                      <li>No quiz results data in the database</li>
                      <li>API authentication issues</li>
                    </ul>
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