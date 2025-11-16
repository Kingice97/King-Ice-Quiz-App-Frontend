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

  // Test API connectivity with detailed logging
  const testApiConnectivity = async (endpoint = '/api/analytics/health') => {
    try {
      console.log(`🔍 Testing endpoint: ${endpoint}`);
      const response = await fetch(endpoint);
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`❌ Non-JSON response from ${endpoint}:`, text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ ${endpoint} response:`, result);
      return { success: true, data: result, status: response.status };
    } catch (error) {
      console.error(`❌ ${endpoint} test failed:`, error.message);
      return { success: false, error: error.message, endpoint };
    }
  };

  // Test all analytics endpoints
  const testAllEndpoints = async () => {
    const endpoints = [
      '/api/analytics/',
      '/api/analytics/health',
      '/api/analytics/test',
      '/api/analytics/admin/stats',
      '/api/analytics/debug'
    ];

    if (isDeveloper) {
      endpoints.push('/api/analytics/platform');
    }

    const results = {};
    for (const endpoint of endpoints) {
      results[endpoint] = await testApiConnectivity(endpoint);
    }
    return results;
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
      console.log('📊 Starting admin analytics fetch...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Test basic connectivity first
      const healthTest = await testApiConnectivity('/api/analytics/health');
      if (!healthTest.success) {
        setApiStatus('disconnected');
        throw new Error(`Analytics API not available: ${healthTest.error}`);
      }
      
      setApiStatus('connected');
      console.log('✅ Analytics API is available, fetching data...');

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
        console.error('❌ Non-JSON response from analytics:', text.substring(0, 200));
        throw new Error(`Analytics endpoint returned HTML. This means the route doesn't exist or there's a routing issue.`);
      }

      const result = await response.json();
      console.log('✅ Analytics data received:', result);

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        setAnalyticsData(result.data);
        console.log('✅ Analytics data set successfully');
      } else {
        throw new Error(result.message || 'Failed to fetch analytics data');
      }
      
    } catch (error) {
      console.error('❌ Analytics fetch error:', error);
      setError(error.message);
      
      // Set minimal fallback data
      setAnalyticsData({
        totalQuizzes: 0,
        totalUsers: 0,
        totalQuestions: 0,
        averageScore: 0,
        totalAttempts: 0,
        growthPercentage: 0,
        scoreDistribution: [
          { range: '0-20%', count: 0 },
          { range: '21-40%', count: 0 },
          { range: '41-60%', count: 0 },
          { range: '61-80%', count: 0 },
          { range: '81-100%', count: 0 }
        ],
        recentActivity: [],
        timeRange: timeRange,
        lastUpdated: new Date(),
        _debug: { status: 'ERROR', error: error.message }
      });
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
      console.log('🔧 Starting platform analytics fetch...');
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
        throw new Error(`Platform analytics returned HTML. Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Platform analytics received:', result);

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
      console.log('🔍 Starting comprehensive debug...');
      const endpointTests = await testAllEndpoints();
      
      setDebugInfo({
        timestamp: new Date().toISOString(),
        endpointTests,
        userInfo: {
          email: currentUser?.email,
          isDeveloper: isDeveloper,
          hasToken: !!localStorage.getItem('token'),
          userId: currentUser?.id
        },
        suggestions: generateSuggestions(endpointTests)
      });
      setShowDebug(true);
      
    } catch (error) {
      console.error('Debug fetch error:', error);
      setDebugInfo({ 
        error: `Debug failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        suggestions: ['Check browser console for detailed errors', 'Verify backend is running and routes are registered']
      });
      setShowDebug(true);
    }
  };

  const generateSuggestions = (endpointTests) => {
    const suggestions = [];
    
    if (!endpointTests['/api/analytics/'].success) {
      suggestions.push('❌ Analytics routes are not registered in backend server.js');
    }
    
    if (!endpointTests['/api/analytics/health'].success) {
      suggestions.push('❌ Analytics health endpoint not working - routes not mounted');
    }
    
    if (!endpointTests['/api/analytics/admin/stats'].success) {
      suggestions.push('❌ Admin stats endpoint requires authentication or not working');
    }
    
    if (endpointTests['/api/analytics/'].success && !endpointTests['/api/analytics/admin/stats'].success) {
      suggestions.push('✅ Routes are registered! Issue might be with authentication');
    }

    if (suggestions.length === 0) {
      suggestions.push('✅ All endpoints are working correctly!');
    }

    return suggestions;
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
          <p className="loading-user">User: {currentUser?.email}</p>
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
              <h3>Avg Score</h3>
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
              <span className="stat-change">Quiz attempts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Show data status */}
      {analyticsData._debug?.status === 'ERROR' && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analytics Data Unavailable</h3>
          <p>{analyticsData._debug.error}</p>
          <p>This could mean:</p>
          <ul>
            <li>You haven't created any quizzes yet</li>
            <li>No users have taken your quizzes</li>
            <li>The analytics API is not properly configured</li>
          </ul>
        </div>
      )}

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

      {/* Empty state */}
      {analyticsData.totalAttempts === 0 && analyticsData._debug?.status !== 'ERROR' && (
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
          <p>Your email: {currentUser?.email}</p>
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
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔧</div>
          <h3>Platform Analytics</h3>
          <p>Platform analytics will show total platform statistics, user growth, and system-wide activity.</p>
          <p>Only accessible to the developer.</p>
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
              Last updated: {new Date().toLocaleString()}
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
        API Status: {apiStatus.toUpperCase()} | User: {currentUser?.email} | Role: {isDeveloper ? 'Developer' : 'Admin'}
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
          
          <div className="debug-suggestions">
            <h4>Diagnosis & Suggestions:</h4>
            <ul>
              {debugInfo.suggestions?.map((suggestion, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: suggestion }} />
              ))}
            </ul>
          </div>
          
          <pre className="debug-output">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Show data */}
      {analyticsData && activeTab === 'my-analytics' && renderMyAnalytics()}
      {activeTab === 'platform' && renderPlatformAnalytics()}
    </div>
  );
};

export default Analytics;