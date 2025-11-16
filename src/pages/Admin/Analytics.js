import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Analytics.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [platformData, setPlatformData] = useState(null);
  const [activeTab, setActiveTab] = useState('my-analytics');
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const isDeveloper = currentUser?.email === 'olubiyiisaacanu@gmail.com';

  const fetchAdminAnalytics = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`/api/analytics/admin/stats?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch analytics data');
      }
      
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformAnalytics = async () => {
    if (!isDeveloper) {
      setError('Access denied. Platform analytics are for developer only.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/analytics/platform', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        setPlatformData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch platform analytics');
      }
      
    } catch (error) {
      console.error('Platform analytics fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-analytics') {
      fetchAdminAnalytics();
    } else if (activeTab === 'platform' && isDeveloper) {
      fetchPlatformAnalytics();
    }
  }, [currentUser, timeRange, activeTab]);

  if (loading) {
    return (
      <div className="analytics">
        <div className="management-header">
          <div className="admin-welcome">
            <h1>Analytics Dashboard</h1>
            <p className="admin-subtitle">
              {activeTab === 'my-analytics' ? 'My Content Analytics' : 'Platform Analytics'}
            </p>
          </div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const renderMyAnalytics = () => (
    <>
      {/* My Content Overview */}
      <div className="admin-content-section">
        <h3>My Content Overview</h3>
        <div className="stats-grid">
          <div className="stat-card admin-specific">
            <div className="stat-icon my-quizzes">
              <i>📝</i>
            </div>
            <div className="stat-info">
              <h3>My Quizzes</h3>
              <p className="stat-number">{analyticsData?.totalQuizzes || 0}</p>
              <span className="stat-change">Quizzes you created</span>
            </div>
          </div>

          <div className="stat-card admin-specific">
            <div className="stat-icon my-users">
              <i>👤</i>
            </div>
            <div className="stat-info">
              <h3>My Quiz Takers</h3>
              <p className="stat-number">{analyticsData?.totalUsers || 0}</p>
              <span className="stat-change">Users who took your quizzes</span>
            </div>
          </div>

          <div className="stat-card admin-specific">
            <div className="stat-icon my-questions">
              <i>❓</i>
            </div>
            <div className="stat-info">
              <h3>My Questions</h3>
              <p className="stat-number">{analyticsData?.totalQuestions || 0}</p>
              <span className="stat-change">Questions in your quizzes</span>
            </div>
          </div>

          <div className="stat-card admin-specific">
            <div className="stat-icon my-score">
              <i>🎯</i>
            </div>
            <div className="stat-info">
              <h3>Avg Score</h3>
              <p className="stat-number">{analyticsData?.averageScore || 0}%</p>
              <span className="stat-change">On your content</span>
            </div>
          </div>

          <div className="stat-card admin-specific">
            <div className="stat-icon my-attempts">
              <i>📊</i>
            </div>
            <div className="stat-info">
              <h3>Total Attempts</h3>
              <p className="stat-number">{analyticsData?.totalAttempts || 0}</p>
              <span className="stat-change">Quiz attempts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {analyticsData?.recentActivity && analyticsData.recentActivity.length > 0 && (
        <div className="recent-activity">
          <h3>Recent Activity on My Quizzes</h3>
          <div className="activity-list">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={activity.id || index} className="activity-item">
                <div className="activity-icon">📝</div>
                <div className="activity-info">
                  <p><strong>{activity.userName}</strong> completed <strong>{activity.quizTitle}</strong></p>
                  <span>Score: {activity.percentage}% • Time: {Math.round(activity.timeTaken / 60)}min</span>
                </div>
                <div className={`activity-status ${activity.passed ? 'passed' : 'failed'}`}>
                  {activity.passed ? 'Passed' : 'Failed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Distribution */}
      {analyticsData?.scoreDistribution && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Score Distribution</h3>
            <div className="chart-content">
              <p>How users scored on your quizzes</p>
              <div className="score-distribution">
                {analyticsData.scoreDistribution.map((item, index) => (
                  <div key={index} className="distribution-item">
                    <span className="range">{item.range}</span>
                    <div className="distribution-bar">
                      <div 
                        className="distribution-fill"
                        style={{ 
                          width: analyticsData.totalAttempts > 0 
                            ? `${(item.count / analyticsData.totalAttempts) * 100}%` 
                            : '0%' 
                        }}
                      ></div>
                    </div>
                    <span className="count">{item.count}</span>
                  </div>
                ))}
              </div>
              <p className="chart-note">
                Average score: <strong>{analyticsData.averageScore}%</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!analyticsData || analyticsData.totalAttempts === 0) && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Analytics Data Yet</h3>
          <p>Your analytics dashboard is ready, but there's no data to display yet.</p>
          <p>This usually means:</p>
          <ul>
            <li>You haven't created any quizzes</li>
            <li>Users haven't taken your quizzes yet</li>
            <li>Your quizzes are not published</li>
          </ul>
        </div>
      )}
    </>
  );

  const renderPlatformAnalytics = () => (
    <>
      {!isDeveloper ? (
        <div className="error-state">
          <div className="error-icon">🚫</div>
          <h3>Access Denied</h3>
          <p>Platform analytics are only available to the developer.</p>
        </div>
      ) : platformData ? (
        <>
          <div className="admin-content-section">
            <h3>Platform Overview</h3>
            <div className="stats-grid">
              <div className="stat-card platform-specific">
                <div className="stat-icon platform-users">
                  <i>👥</i>
                </div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-number">{platformData.platform.totalUsers}</p>
                  <span className="stat-change">{platformData.platform.newUsersLast30Days} new in 30 days</span>
                </div>
              </div>

              <div className="stat-card platform-specific">
                <div className="stat-icon platform-admins">
                  <i>👑</i>
                </div>
                <div className="stat-info">
                  <h3>Total Admins</h3>
                  <p className="stat-number">{platformData.platform.totalAdmins}</p>
                  <span className="stat-change">Platform administrators</span>
                </div>
              </div>

              <div className="stat-card platform-specific">
                <div className="stat-icon platform-quizzes">
                  <i>📝</i>
                </div>
                <div className="stat-info">
                  <h3>Total Quizzes</h3>
                  <p className="stat-number">{platformData.platform.totalQuizzes}</p>
                  <span className="stat-change">{platformData.platform.newQuizzesLast30Days} new in 30 days</span>
                </div>
              </div>

              <div className="stat-card platform-specific">
                <div className="stat-icon platform-results">
                  <i>📊</i>
                </div>
                <div className="stat-info">
                  <h3>Total Results</h3>
                  <p className="stat-number">{platformData.platform.totalResults}</p>
                  <span className="stat-change">Quiz attempts</span>
                </div>
              </div>

              <div className="stat-card platform-specific">
                <div className="stat-icon platform-score">
                  <i>🎯</i>
                </div>
                <div className="stat-info">
                  <h3>Platform Avg Score</h3>
                  <p className="stat-number">{platformData.platform.platformAverageScore}%</p>
                  <span className="stat-change">Across all quizzes</span>
                </div>
              </div>
            </div>
          </div>

          {platformData.recentActivity && platformData.recentActivity.length > 0 && (
            <div className="recent-activity">
              <h3>Recent Platform Activity</h3>
              <div className="activity-list">
                {platformData.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={activity.id || index} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-info">
                      <p><strong>{activity.userName}</strong> completed <strong>{activity.quizTitle}</strong></p>
                      <span>Score: {activity.percentage}% • {new Date(activity.completedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {platformData.popularQuizzes && platformData.popularQuizzes.length > 0 && (
            <div className="recent-activity">
              <h3>Popular Quizzes</h3>
              <div className="activity-list">
                {platformData.popularQuizzes.slice(0, 5).map((quiz, index) => (
                  <div key={quiz.id || index} className="activity-item">
                    <div className="activity-icon">🔥</div>
                    <div className="activity-info">
                      <p><strong>{quiz.title}</strong> - {quiz.category}</p>
                      <span>Times taken: {quiz.timesTaken} • Avg score: {quiz.averageScore}% • By: {quiz.createdBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔧</div>
          <h3>Platform Analytics</h3>
          <p>Platform analytics will show total platform statistics, user growth, and system-wide activity.</p>
          <p>Only accessible to the developer.</p>
          <button 
            className="btn-primary"
            onClick={fetchPlatformAnalytics}
          >
            Load Platform Data
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="analytics">
      <div className="management-header">
        <div className="admin-welcome">
          <h1>Analytics Dashboard</h1>
          <p className="admin-subtitle">
            {activeTab === 'my-analytics' ? 'My Content Analytics' : 'Platform Analytics'}
            {isDeveloper && <span className="developer-badge"> (Developer)</span>}
          </p>
        </div>
        <div className="time-filter">
          {activeTab === 'my-analytics' && (
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          )}
          <button 
            className="btn-primary"
            onClick={activeTab === 'my-analytics' ? fetchAdminAnalytics : fetchPlatformAnalytics}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="analytics-tabs">
        <button 
          className={`tab-button ${activeTab === 'my-analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-analytics')}
        >
          My Analytics
        </button>
        {isDeveloper && (
          <button 
            className={`tab-button ${activeTab === 'platform' ? 'active' : ''}`}
            onClick={() => setActiveTab('platform')}
          >
            Platform Analytics
          </button>
        )}
      </div>

      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Analytics</h3>
          <p>{error}</p>
          <button 
            className="btn-primary"
            onClick={activeTab === 'my-analytics' ? fetchAdminAnalytics : fetchPlatformAnalytics}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Show data */}
      {!error && activeTab === 'my-analytics' && renderMyAnalytics()}
      {!error && activeTab === 'platform' && renderPlatformAnalytics()}
    </div>
  );
};

export default Analytics;