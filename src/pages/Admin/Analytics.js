import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Analytics.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchAdminAnalytics = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log(`📊 Fetching analytics for time range: ${timeRange}`);
        const token = localStorage.getItem('token');
        
        // FIXED: Use correct endpoint - /api/analytics/admin/stats
        const response = await fetch(`/api/analytics/admin/stats?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Analytics API response:', result);

        if (result.success) {
          setAnalyticsData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch analytics data');
        }
        
      } catch (error) {
        console.error('❌ Analytics fetch error:', error);
        setError(error.message || 'Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminAnalytics();
  }, [currentUser, timeRange]);

  if (loading) {
    return (
      <div className="analytics">
        <div className="management-header">
          <div className="admin-welcome">
            <h1>My Analytics Dashboard</h1>
            <p className="admin-subtitle">
              Insights for {currentUser?.name || currentUser?.username || 'Your Content'}
            </p>
          </div>
          <div className="time-filter">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              disabled
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your analytics data...</p>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="analytics">
        <div className="management-header">
          <div className="admin-welcome">
            <h1>My Analytics Dashboard</h1>
            <p className="admin-subtitle">
              Insights for {currentUser?.name || currentUser?.username || 'Your Content'}
            </p>
          </div>
          <div className="time-filter">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Analytics</h3>
          <p>{error}</p>
          <button 
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="management-header">
        <div className="admin-welcome">
          <h1>My Analytics Dashboard</h1>
          <p className="admin-subtitle">
            Insights for {currentUser?.name || currentUser?.username || 'Your Content'}
          </p>
          {analyticsData && (
            <p className="last-updated">
              Last updated: {new Date(analyticsData.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        <div className="time-filter">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Show data when available */}
      {analyticsData && (
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
                  <p className="stat-number">{analyticsData.totalQuizzes}</p>
                  <span className="stat-change">Quizzes you created</span>
                </div>
              </div>

              <div className="stat-card admin-specific">
                <div className="stat-icon my-users">
                  <i>👤</i>
                </div>
                <div className="stat-info">
                  <h3>My Quiz Takers</h3>
                  <p className="stat-number">{analyticsData.totalUsers}</p>
                  <span className="stat-change">Users who took your quizzes</span>
                </div>
              </div>

              <div className="stat-card admin-specific">
                <div className="stat-icon my-questions">
                  <i>❓</i>
                </div>
                <div className="stat-info">
                  <h3>My Questions</h3>
                  <p className="stat-number">{analyticsData.totalQuestions}</p>
                  <span className="stat-change">Questions in your quizzes</span>
                </div>
              </div>

              <div className="stat-card admin-specific">
                <div className="stat-icon my-score">
                  <i>🎯</i>
                </div>
                <div className="stat-info">
                  <h3>Avg Score (My Quizzes)</h3>
                  <p className="stat-number">{analyticsData.averageScore}%</p>
                  <span className="stat-change">On your content</span>
                </div>
              </div>

              <div className="stat-card admin-specific">
                <div className="stat-icon my-attempts">
                  <i>📊</i>
                </div>
                <div className="stat-info">
                  <h3>Total Attempts</h3>
                  <p className="stat-number">{analyticsData.totalAttempts}</p>
                  <span className="stat-change">
                    {analyticsData.growthPercentage > 0 ? '↑' : '↓'} 
                    {Math.abs(analyticsData.growthPercentage)}% from previous period
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 && (
            <div className="recent-activity">
              <h3>Recent Activity on My Quizzes</h3>
              <div className="activity-list">
                {analyticsData.recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-info">
                      <p><strong>{activity.userName}</strong> completed <strong>{activity.quizTitle}</strong></p>
                      <span>Score: {activity.percentage}% • Time: {Math.round(activity.timeTaken / 60)}min • {new Date(activity.completedAt).toLocaleDateString()}</span>
                    </div>
                    <div className={`activity-status ${activity.passed ? 'passed' : 'failed'}`}>
                      {activity.passed ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts with Real Data */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>My Users Growth</h3>
              <div className="chart-content">
                <p>Total users who took your quizzes: <strong>{analyticsData.totalUsers}</strong></p>
                <div className="growth-stats">
                  <div className="growth-item">
                    <span className="growth-label">Total Attempts:</span>
                    <span className="growth-value">{analyticsData.totalAttempts}</span>
                  </div>
                  <div className="growth-item">
                    <span className="growth-label">Growth Rate:</span>
                    <span className={`growth-value ${analyticsData.growthPercentage > 0 ? 'positive' : 'negative'}`}>
                      {analyticsData.growthPercentage > 0 ? '↑' : '↓'} {Math.abs(analyticsData.growthPercentage)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3>Score Distribution (My Quizzes)</h3>
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

          {/* Show empty state if no activity yet */}
          {analyticsData.totalAttempts === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <i>📊</i>
              </div>
              <h3>Your Analytics Dashboard is Ready!</h3>
              <p>This dashboard is now connected and will show insights specifically for <strong>your quizzes and your users</strong>.</p>
              <p className="empty-subtext">
                Once users start taking your quizzes, you'll see real data here showing:
              </p>
              <ul className="features-list">
                <li>📊 Performance of <strong>your quizzes</strong></li>
                <li>👥 Users who took <strong>your quizzes</strong></li>
                <li>⭐ Average scores on <strong>your content</strong></li>
                <li>📈 Growth metrics for <strong>your audience</strong></li>
              </ul>
              <div className="success-note">
                <p><strong>✅ Analytics System Active:</strong> The backend is now fully connected and ready to display your data!</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;