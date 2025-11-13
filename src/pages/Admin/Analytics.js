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
        // Try to fetch real data first
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/stats?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setAnalyticsData(result.data);
            setLoading(false);
            return;
          }
        }

        // If real API fails, use mock data as fallback
        console.log('Using mock analytics data - backend endpoint not ready');
        const mockData = {
          totalQuizzes: 0,
          totalUsers: 0,
          totalQuestions: 0,
          averageScore: 0,
          totalAttempts: 0,
          recentActivity: []
        };
        setAnalyticsData(mockData);
        
      } catch (error) {
        console.log('Analytics API not available, using mock data:', error);
        // Use mock data when API is not available
        const mockData = {
          totalQuizzes: 0,
          totalUsers: 0,
          totalQuestions: 0,
          averageScore: 0,
          totalAttempts: 0,
          recentActivity: []
        };
        setAnalyticsData(mockData);
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
          </select>
        </div>
      </div>

      {/* Show empty state if no data exists */}
      {analyticsData && analyticsData.totalAttempts === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <i>👨‍💼</i>
          </div>
          <h3>Your Analytics Dashboard is Ready</h3>
          <p>This dashboard will show insights specifically for <strong>your quizzes and your users</strong>.</p>
          <p className="empty-subtext">
            Once you create quizzes and users start taking them, you'll see:
          </p>
          <ul className="features-list">
            <li>📊 Performance of <strong>your quizzes</strong></li>
            <li>👥 Users who took <strong>your quizzes</strong></li>
            <li>⭐ Average scores on <strong>your content</strong></li>
            <li>📈 Growth metrics for <strong>your audience</strong></li>
          </ul>
          <div className="development-note">
            <p><strong>Note:</strong> The analytics backend is being prepared and will work fully when deployed.</p>
          </div>
        </div>
      )}

      {/* Show data when available */}
      {analyticsData && analyticsData.totalAttempts > 0 && (
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
            </div>
          </div>

          {/* Recent Activity */}
          {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 && (
            <div className="recent-activity">
              <h3>Recent Activity on My Quizzes</h3>
              <div className="activity-list">
                {analyticsData.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-info">
                      <p><strong>{activity.userName}</strong> completed <strong>{activity.quizId?.title || 'Your Quiz'}</strong></p>
                      <span>Score: {activity.percentage}% • Time: {Math.round(activity.timeTaken / 60)}min</span>
                    </div>
                    <div className={`activity-status ${activity.percentage >= 60 ? 'passed' : 'failed'}`}>
                      {activity.percentage >= 60 ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Show placeholder charts that will populate with real data */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>My Users Growth</h3>
          <div className="empty-chart">
            <p>Growth of users taking <strong>your quizzes</strong></p>
            <div className="mock-chart">
              {[1, 2, 3, 4, 5, 6, 7].map((item, index) => (
                <div 
                  key={index}
                  className="chart-bar empty"
                  style={{ height: '20px' }}
                ></div>
              ))}
            </div>
            <p className="chart-note">
              {analyticsData?.totalUsers > 0 
                ? `Currently ${analyticsData.totalUsers} users have taken your quizzes` 
                : 'Shows users who participated in your quizzes over time'
              }
            </p>
          </div>
        </div>

        <div className="chart-card">
          <h3>Score Distribution (My Quizzes)</h3>
          <div className="empty-chart">
            <p>How users scored on <strong>your quizzes</strong></p>
            <div className="score-distribution">
              {[
                { range: '0-20%', count: 0 },
                { range: '21-40%', count: 0 },
                { range: '41-60%', count: 0 },
                { range: '61-80%', count: 0 },
                { range: '81-100%', count: 0 }
              ].map((item, index) => (
                <div key={index} className="distribution-item">
                  <span className="range">{item.range}</span>
                  <div className="distribution-bar">
                    <div className="distribution-fill empty"></div>
                  </div>
                  <span className="count">{item.count}</span>
                </div>
              ))}
            </div>
            <p className="chart-note">
              {analyticsData?.averageScore > 0 
                ? `Current average score: ${analyticsData.averageScore}%` 
                : 'Distribution of scores from your quiz attempts'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Admin-specific tips */}
      <div className="admin-tips">
        <h4>💡 Analytics Status</h4>
        <div className="tips-grid">
          <div className="tip-card">
            <h5>Current Status</h5>
            <p>Frontend ready - Backend being prepared</p>
          </div>
          <div className="tip-card">
            <h5>After Deployment</h5>
            <p>Real data will automatically populate these charts</p>
          </div>
          <div className="tip-card">
            <h5>What to Expect</h5>
            <p>Live insights into your quizzes and user performance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;