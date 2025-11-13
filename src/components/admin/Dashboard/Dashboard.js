import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const AdminDashboard = ({ stats, recentQuizzes, recentResults, userLeaderboard }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate user counts EXCLUDING admin (assuming 1 admin user)
  const regularUsersCount = stats.totalUsers ? Math.max(0, stats.totalUsers - 1) : 0;
  const activeRegularUsers = stats.activeUsers || 0;

  // Admin quick actions
  const quickActions = [
    { label: 'Manage Users', path: '/admin/users', icon: '👥', description: 'View and manage users' },
    { label: 'System Analytics', path: '/admin/analytics', icon: '📊', description: 'View detailed analytics' },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Platform management and analytics</p>
      </div>

      {/* Platform Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card admin-stat">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalQuizzes || 0}</span>
            <span className="stat-label">Total Quizzes</span>
          </div>
        </div>
        
        <div className="stat-card admin-stat">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{regularUsersCount}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        
        <div className="stat-card admin-stat">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalAttempts || 0}</span>
            <span className="stat-label">Total Attempts</span>
          </div>
        </div>
        
        <div className="stat-card admin-stat">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <span className="stat-value">{activeRegularUsers}</span>
            <span className="stat-label">Active Users</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.path} className="quick-action-card">
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h4>{action.label}</h4>
                <p>{action.description}</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Quizzes */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Recent Quizzes</h3>
            <Link to="/admin/quizzes" className="btn btn-outline btn-sm">
              Manage All
            </Link>
          </div>
          <div className="quizzes-list">
            {recentQuizzes?.length > 0 ? (
              recentQuizzes.map(quiz => (
                <div key={quiz._id} className="quiz-item admin-quiz-item">
                  <div className="quiz-info">
                    <h4>{quiz.title}</h4>
                    <p>{quiz.category} • {quiz.difficulty}</p>
                    <div className="quiz-meta">
                      <span>{quiz.questions?.length || 0} questions</span>
                      <span>{quiz.stats?.timesTaken || 0} attempts</span>
                      <span>{Math.round(quiz.stats?.averageScore || 0)}% avg</span>
                    </div>
                  </div>
                  <div className="quiz-status">
                    <span className={`status ${quiz.isActive ? 'active' : 'inactive'}`}>
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>No quizzes created yet</p>
                <Link to="/admin/quizzes" className="btn btn-primary btn-sm">
                  Create First Quiz
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Platform Activity */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Recent Platform Activity</h3>
            {/* FIXED: Link to the correct results page */}
            <Link to="/admin/results" className="btn btn-outline btn-sm">
              View All
            </Link>
          </div>
          <div className="results-list">
            {recentResults?.length > 0 ? (
              recentResults.map(result => (
                <div key={result._id} className="result-item admin-result-item">
                  <div className="user-info">
                    <strong>{result.userName}</strong>
                    <span>{result.quizId?.title}</span>
                    <small>{formatDate(result.completedAt)}</small>
                  </div>
                  <div className="result-info">
                    <span className={`score ${result.passed ? 'passed' : 'failed'}`}>
                      {Math.round(result.percentage)}%
                    </span>
                    <span className="details">
                      {result.score}/{result.totalQuestions}
                    </span>
                    <span className="time">{result.timeTaken}s</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>No recent activity on the platform</p>
                <p>Activity will appear here when users take quizzes</p>
              </div>
            )}
          </div>
        </div>

        {/* User Leaderboard */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Top Performers</h3>
            <Link to="/admin/leaderboard" className="btn btn-outline btn-sm">
              View All
            </Link>
          </div>
          <div className="leaderboard-list">
            {userLeaderboard?.length > 0 ? (
              userLeaderboard.map((user, index) => (
                <div key={user._id} className="leaderboard-item">
                  <div className="rank">#{index + 1}</div>
                  <div className="user-info">
                    <strong>{user.username}</strong>
                    <span>{user.quizzesTaken} quizzes taken</span>
                  </div>
                  <div className="user-stats">
                    <span className="score">{Math.round(user.averageScore)}% avg</span>
                    <span className="best-score">Best: {Math.round(user.bestScore)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>No user data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;