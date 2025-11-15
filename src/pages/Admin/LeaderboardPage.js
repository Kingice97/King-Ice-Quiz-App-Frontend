import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useApi } from '../../hooks/useApi';
import { userService } from '../../services/userService';
import Loading from '../../components/common/Loading/Loading';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [limit, setLimit] = useState(20);

  const { data: leaderboardData, loading: leaderboardLoading, error: leaderboardError } = useApi(() =>
    userService.getLeaderboard({ limit, timeframe: timeFilter }) // FIXED: Pass timeframe to backend
  );

  // DEBUG: Enhanced logging to inspect data structure
  console.log('🔍 Leaderboard Debug - Raw Data:', leaderboardData);
  console.log('🔍 Leaderboard Debug - Data Structure:', leaderboardData?.data);
  console.log('🔍 Leaderboard Debug - First User:', leaderboardData?.data?.[0]);

  // FIXED: Better data extraction with detailed inspection
  const leaderboard = React.useMemo(() => {
    if (leaderboardError) {
      console.error('🚨 Leaderboard API error:', leaderboardError);
      return [];
    }
    
    if (!leaderboardData) return [];
    
    // Log the full data structure for inspection
    console.log('📊 Full leaderboard data for inspection:', leaderboardData);
    
    // Handle different response structures
    let data = [];
    
    if (Array.isArray(leaderboardData.data)) {
      data = leaderboardData.data;
    } else if (Array.isArray(leaderboardData)) {
      data = leaderboardData;
    } else if (leaderboardData.leaderboard) {
      data = leaderboardData.leaderboard;
    }
    
    console.log('📊 Extracted leaderboard array:', data);
    
    // Log each user's data to check bestScore
    data.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`, {
        username: user.username || user.user?.username,
        bestScore: user.bestScore,
        averageScore: user.averageScore,
        quizzesTaken: user.quizzesTaken,
        fullData: user
      });
    });
    
    return data;
  }, [leaderboardData, leaderboardError]);

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

  // FIXED: Enhanced username extraction with debugging
  const getUsername = (user) => {
    const username = user.username || user.user?.username || user.userName || 'Unknown User';
    console.log(`🔍 Extracting username for user:`, { 
      rawUser: user, 
      extractedUsername: username 
    });
    return username;
  };

  // FIXED: Enhanced stats extraction with debugging
  const getUserStats = (user) => {
    const userObj = user.user || user;
    
    const stats = {
      quizzesTaken: user.quizzesTaken || userObj.quizzesTaken || user.stats?.quizzesTaken || 0,
      averageScore: user.averageScore || userObj.averageScore || user.stats?.averageScore || 0,
      bestScore: user.bestScore || userObj.bestScore || user.stats?.bestScore || 0,
      totalPoints: user.totalPoints || userObj.totalPoints || user.stats?.totalPoints || 0,
      createdAt: user.createdAt || userObj.createdAt,
      role: user.role || userObj.role
    };
    
    console.log(`📊 User stats for ${getUsername(user)}:`, stats);
    
    return stats;
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

  // Test time filter functionality
  React.useEffect(() => {
    console.log(`🕒 Time filter changed to: ${timeFilter}`);
    console.log(`🔢 Limit changed to: ${limit}`);
  }, [timeFilter, limit]);

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
            <div className="debug-info">
              <small>Users: {leaderboard.length} | Loading: {leaderboardLoading.toString()} | Error: {leaderboardError ? 'Yes' : 'No'}</small>
            </div>
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
            <label>Time Period:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="form-control"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            <label>Show Top:</label>
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
          
          <div className="filter-info">
            <small>Current filters: {timeFilter} period, Top {limit} users</small>
          </div>
        </div>


        // Add this temporary debug section right after the filters section
{/* Temporary Debug Button */}
<div className="debug-section" style={{ marginBottom: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
  <button 
    onClick={() => {
      console.log('🔄 Manual refresh triggered');
      console.log('📊 Current leaderboard data:', leaderboardData);
      console.log('👥 Current leaderboard array:', leaderboard);
      
      // Force re-fetch by updating state
      window.location.reload();
    }}
    className="btn btn-sm btn-outline"
  >
    🔄 Debug Refresh
  </button>
  <small style={{ marginLeft: '10px', color: '#666' }}>
    Click to see detailed data in console
  </small>
</div>


        {/* Leaderboard */}
        <div className="leaderboard-section">
          {leaderboardLoading ? (
            <Loading text="Loading leaderboard..." />
          ) : (
            <>
              <div className="leaderboard-stats">
                <span>Showing: {leaderboard.length} users</span>
                {leaderboard.length > 0 && (
                  <span className="data-source">
                    Data source: Backend API
                  </span>
                )}
              </div>

              <div className="leaderboard-list">
                {leaderboard.map((user, index) => {
                  const username = getUsername(user);
                  const stats = getUserStats(user);
                  
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
                          <div className="user-debug">
                            <small>ID: {user._id?.slice(-6)}</small>
                          </div>
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
                          <span className={`stat-value ${stats.bestScore === 0 ? 'zero-score' : ''}`}>
                            {Math.round(stats.bestScore)}%
                            {stats.bestScore === 0 && <span className="score-warning"> ⚠️</span>}
                          </span>
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

              {leaderboard.length === 0 && !leaderboardLoading && (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No Leaderboard Data</h3>
                  <p>Check browser console for detailed API response information.</p>
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