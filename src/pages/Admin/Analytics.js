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
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const { currentUser } = useAuth();

  const isDeveloper = currentUser?.email === 'olubiyiisaacanu@gmail.com';

  // Test API connectivity
  const testApiConnectivity = async (endpoint = '/api/analytics/test') => {
    try {
      const response = await fetch(endpoint);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      const result = await response.json();
      return { success: true, data: result, status: response.status };
    } catch (error) {
      return { success: false, error: error.message, endpoint };
    }
  };

  const fetchAdminAnalytics = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Test basic connectivity
      const connectivityTest = await testApiConnectivity('/api/analytics/test');
      if (!connectivityTest.success) {
        setApiStatus('disconnected');
        throw new Error(`Cannot connect to analytics API: ${connectivityTest.error}`);
      }
      
      setApiStatus('connected');

      // Fetch analytics data
      const response = await fetch(`/api/analytics/admin/stats?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Analytics API response:', result);

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch analytics data');
      }
      
    } catch (error) {
      console.error('❌ Analytics fetch error:', error);
      setError(error.message);
      
      // Set fallback data
      setAnalyticsData({
        totalQuizzes: 3,
        totalUsers: 3,
        totalQuestions: 15,
        averageScore: 75,
        totalAttempts: 8,
        growthPercentage: 0,
        scoreDistribution: [
          { range: '0-20%', count: 0 },
          { range: '21-40%', count: 1 },
          { range: '41-60%', count: 2 },
          { range: '61-80%', count: 3 },
          { range: '81-100%', count: 2 }
        ],
        recentActivity: [
          {
            id: 1,
            userName: 'Example User',
            quizTitle: 'Sample Quiz',
            score: 85,
            percentage: 85,
            timeTaken: 300,
            completedAt: new Date(),
            passed: true
          }
        ],
        timeRange: timeRange,
        lastUpdated: new Date(),
        _debug: { status: 'FALLBACK_UI_DATA', error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformAnalytics = async () => {
    if (!isDeveloper) return;

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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Platform analytics response:', result);

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        setPlatformData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch platform analytics');
      }
      
    } catch (error) {
      console.error('❌ Platform analytics fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebugInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoints = [
        '/api/analytics/test',
        '/api/analytics/admin/stats',
        '/api/analytics/debug'
      ];

      if (isDeveloper) {
        endpoints.push('/api/analytics/platform');
      }

      const endpointTests = {};
      for (const endpoint of endpoints) {
        const result = await testApiConnectivity(endpoint);
        endpointTests[endpoint] = result;
      }

      setDebugInfo({
        timestamp: new Date().toISOString(),
        endpointTests,
        userInfo: {
          email: currentUser?.email,
          isDeveloper: isDeveloper,
          hasToken: !!localStorage.getItem('token')
        }
      });
      setShowDebug(true);
      
    } catch (error) {
      console.error('Debug fetch error:', error);
      setDebugInfo({ 
        error: `Debug failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      setShowDebug(true);
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
          <p className="loading-status">API Status: {apiStatus}</p>
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

      {/* Charts */}
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
          {/* Platform Overview */}
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

          {/* Recent Platform Activity */}
          {platformData.recentActivity && platformData.recentActivity.length > 0 && (
            <div className="recent-activity">
              <h3>Recent Platform Activity</h3>
              <div className="activity-list">
                {platformData.recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-info">
                      <p><strong>{activity.userName}</strong> completed <strong>{activity.quizTitle}</strong></p>
                      <span>Score: {activity.percentage}% • {new Date(activity.completedAt).toLocaleDateString()}</span>
                    </div>
                    <div className={`activity-status ${activity.passed ? 'passed' : 'failed'}`}>
                      {activity.passed ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Quizzes */}
          {platformData.popularQuizzes && platformData.popularQuizzes.length > 0 && (
            <div className="recent-activity">
              <h3>Popular Quizzes</h3>
              <div className="activity-list">
                {platformData.popularQuizzes.map((quiz, index) => (
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
        <div className="loading-state">
          <p>No platform data available</p>
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
          {analyticsData && (
            <p className="last-updated">
              Last updated: {new Date(analyticsData.lastUpdated).toLocaleString()}
              {analyticsData._debug?.status && ` (${analyticsData._debug.status})`}
            </p>
          )}
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
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
          )}
          <button 
            className="btn-secondary debug-btn"
            onClick={fetchDebugInfo}
          >
            Debug API
          </button>
          <button 
            className="btn-secondary"
            onClick={activeTab === 'my-analytics' ? fetchAdminAnalytics : fetchPlatformAnalytics}
          >
            Refresh
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

      {/* API Status */}
      <div className={`api-status ${apiStatus}`}>
        API Status: {apiStatus.toUpperCase()}
      </div>

      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analytics Issue</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="btn-primary"
              onClick={activeTab === 'my-analytics' ? fetchAdminAnalytics : fetchPlatformAnalytics}
            >
              Try Again
            </button>
            <button 
              className="btn-secondary"
              onClick={fetchDebugInfo}
            >
              Debug API
            </button>
          </div>
        </div>
      )}

      {/* Debug Information */}
      {showDebug && debugInfo && (
        <div className="debug-section">
          <h3>🔍 API Debug Information</h3>
          <button 
            className="btn-secondary"
            onClick={() => setShowDebug(false)}
          >
            Hide Debug
          </button>
          <pre className="debug-output">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Show data when available */}
      {analyticsData && activeTab === 'my-analytics' && renderMyAnalytics()}
      {activeTab === 'platform' && renderPlatformAnalytics()}

      {/* Show fallback notice */}
      {analyticsData?._debug?.status === 'FALLBACK_UI_DATA' && (
        <div className="fallback-notice">
          <strong>Note:</strong> Showing example data. Real analytics will appear when the API connection is working.
        </div>
      )}
    </div>
  );
};

export default Analytics;