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
    userService.getLeaderboard({ limit, timeframe: timeFilter })
  );

  // FIXED: Better data extraction
  const leaderboard = React.useMemo(() => {
    if (leaderboardError) {
      console.error('🚨 Leaderboard API error:', leaderboardError);
      return [];
    }
    
    if (!leaderboardData) return [];
    
    let data = [];
    
    if (Array.isArray(leaderboardData.data)) {
      data = leaderboardData.data;
    } else if (Array.isArray(leaderboardData)) {
      data = leaderboardData;
    } else if (leaderboardData.leaderboard) {
      data = leaderboardData.leaderboard;
    }
    
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

  const getUsername = (user) => {
    return user.username || user.user?.username || user.userName || 'Unknown User';
  };

  const getUserObject = (user) => {
    return user.user || user;
  };

  // FIXED: Use top-level leaderboard stats instead of user document stats
  const getUserStats = (user) => {
    const userObj = user.user || user;
    
    const stats = {
      // Use top-level leaderboard stats (these are calculated correctly)
      quizzesTaken: user.quizzesTaken || 0,
      averageScore: user.averageScore || 0,
      // FIXED: Use top-level averageScore as bestScore if user.stats.bestScore is 0
      bestScore: user.bestScore || userObj.bestScore || user.stats?.bestScore || userObj.stats?.bestScore || user.averageScore || 0,
      totalPoints: user.totalPoints || 0,
      createdAt: user.createdAt || userObj.createdAt,
      role: user.role || userObj.role
    };
    
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
        </div>

        {/* Leaderboard */}
        <div className="leaderboard-section">
          {leaderboardLoading ? (
            <Loading text="Loading leaderboard..." />
          ) : (
            <>
              <div className="leaderboard-stats">
                <span>Showing: {leaderboard.length} users</span>
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