import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Analytics.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const { currentUser } = useAuth();

  // Test basic API connectivity
  const testApiConnectivity = async (endpoint = '/api/analytics/test') => {
    try {
      console.log(`🔍 Testing connectivity to: ${endpoint}`);
      const response = await fetch(endpoint);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      const result = await response.json();
      return { 
        success: true, 
        data: result,
        status: response.status
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        endpoint
      };
    }
  };

  // Test all possible endpoints
  const testAllEndpoints = async () => {
    const endpoints = [
      '/api/analytics/test',
      '/api/analytics/public-debug',
      '/api/analytics/admin/stats',
      '/api/analytics/debug'
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      console.log(`Testing endpoint: ${endpoint}`);
      const result = await testApiConnectivity(endpoint);
      results[endpoint] = result;
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
      console.log(`📊 Fetching analytics for time range: ${timeRange}`);
      const token = localStorage.getItem('token');
      
      // First test basic connectivity to public endpoint
      const connectivityTest = await testApiConnectivity('/api/analytics/test');
      if (!connectivityTest.success) {
        setApiStatus('disconnected');
        throw new Error(`Cannot connect to analytics API: ${connectivityTest.error}`);
      }
      
      setApiStatus('connected');

      // Now try the main analytics endpoint
      const response = await fetch(`/api/analytics/admin/stats?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response from /api/analytics/admin/stats:', text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This means the endpoint doesn't exist.`);
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
      
      // Set fallback data for development
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

  const fetchDebugInfo = async () => {
    try {
      console.log('🔍 Starting comprehensive debug...');
      const token = localStorage.getItem('token');
      
      // Test all endpoints first
      const endpointTests = await testAllEndpoints();
      
      // Try the debug endpoint with auth
      let debugResult = null;
      try {
        const response = await fetch('/api/analytics/debug', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            debugResult = await response.json();
          } else {
            const text = await response.text();
            debugResult = { error: `Non-JSON response: ${text.substring(0, 100)}...` };
          }
        } else {
          debugResult = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
      } catch (debugError) {
        debugResult = { error: `Debug endpoint error: ${debugError.message}` };
      }

      const comprehensiveDebug = {
        timestamp: new Date().toISOString(),
        endpointTests,
        debugEndpoint: debugResult,
        userInfo: {
          isAuthenticated: !!currentUser,
          userId: currentUser?.id,
          username: currentUser?.username,
          hasToken: !!localStorage.getItem('token')
        },
        suggestions: []
      };

      // Add suggestions based on test results
      if (!endpointTests['/api/analytics/test'].success) {
        comprehensiveDebug.suggestions.push('❌ Basic analytics route not registered in server.js');
      }
      if (!endpointTests['/api/analytics/public-debug'].success) {
        comprehensiveDebug.suggestions.push('❌ Public debug route not working');
      }
      if (!endpointTests['/api/analytics/admin/stats'].success) {
        comprehensiveDebug.suggestions.push('❌ Admin stats route requires authentication or not registered');
      }
      if (!endpointTests['/api/analytics/debug'].success) {
        comprehensiveDebug.suggestions.push('❌ Debug route requires authentication or not registered');
      }

      if (comprehensiveDebug.suggestions.length === 0) {
        comprehensiveDebug.suggestions.push('✅ All endpoints are accessible');
      }

      setDebugInfo(comprehensiveDebug);
      setShowDebug(true);
      
    } catch (error) {
      console.error('Comprehensive debug error:', error);
      setDebugInfo({ 
        error: `Comprehensive debug failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        suggestions: [
          'Check if analytics routes are registered in backend/server.js',
          'Check backend console for route loading messages',
          'Verify the backend is running and accessible'
        ]
      });
      setShowDebug(true);
    }
  };

  useEffect(() => {
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
              <option value="all">All Time</option>
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
          <p className="loading-status">API Status: {apiStatus}</p>
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
              {analyticsData._debug?.status && ` (${analyticsData._debug.status})`}
            </p>
          )}
        </div>
        <div className="time-filter">
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
          <button 
            className="btn-secondary debug-btn"
            onClick={fetchDebugInfo}
          >
            Debug API
          </button>
          <button 
            className="btn-secondary"
            onClick={fetchAdminAnalytics}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* API Status Indicator */}
      <div className={`api-status ${apiStatus}`}>
        API Status: {apiStatus.toUpperCase()}
      </div>

      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analytics Dashboard Issue</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="btn-primary"
              onClick={fetchAdminAnalytics}
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
          <div className="error-help">
            <p><strong>Quick Fix Checklist:</strong></p>
            <ul>
              <li>✅ Check if <code>analyticsRoutes</code> are registered in <code>backend/server.js</code></li>
              <li>✅ Verify backend is running and routes are loaded</li>
              <li>✅ Check browser Network tab for exact API call details</li>
              <li>✅ Click "Debug API" for comprehensive route testing</li>
            </ul>
          </div>
        </div>
      )}

      

      {/* Debug Information */}
      {showDebug && debugInfo && (
        <div className="debug-section">
          <h3>🔍 Comprehensive API Debug Information</h3>
          <button 
            className="btn-secondary"
            onClick={() => setShowDebug(false)}
          >
            Hide Debug
          </button>
          
          <div className="debug-suggestions">
            <h4>Suggestions:</h4>
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

      {/* Show data when available */}
      {analyticsData && (
        <>
          {/* Show data source notice if using fallback */}
          {analyticsData._debug?.status === 'FALLBACK_UI_DATA' && (
            <div className="fallback-notice">
              <strong>Note:</strong> Showing example data. Real analytics will appear when the API connection is working.
              <br />
              <small>Error: {analyticsData._debug.error}</small>
            </div>
          )}

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
          {analyticsData.totalAttempts === 0 && analyticsData._debug?.status !== 'FALLBACK_UI_DATA' && (
            <div className="empty-state">
              <div className="empty-icon">
                <i>📊</i>
              </div>
              <h3>Analytics Dashboard Ready - No Data Yet</h3>
              <p>The system is working, but we haven't found any quiz attempts on your content yet.</p>
              <p className="empty-subtext">
                This could mean:
              </p>
              <ul className="features-list">
                <li>👥 Users haven't taken your quizzes yet</li>
                <li>📝 Your quizzes might not be published or active</li>
                <li>🕒 The time range filter might be excluding existing data</li>
              </ul>
              <div className="success-note">
                <p><strong>✅ System Status:</strong> Analytics backend is connected and ready!</p>
                <p>Try clicking "Debug Data" to see what quizzes and results the system can detect.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Add this function to test direct backend URL
const testDirectBackendUrl = async () => {
  const backendUrl = 'https://king-ice-quiz-app.onrender.com'; // REPLACE with your actual backend URL
  
  try {
    const response = await fetch(`${backendUrl}/api/analytics/`);
    const text = await response.text();
    
    console.log('Direct backend test response:', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      first200Chars: text.substring(0, 200)
    });
    
    // Check if it's JSON
    if (text.trim().startsWith('{')) {
      try {
        const json = JSON.parse(text);
        setDebugInfo({
          directTest: {
            success: true,
            backendUrl,
            response: json
          }
        });
      } catch (e) {
        setDebugInfo({
          directTest: {
            success: false,
            backendUrl, 
            error: 'Response looks like JSON but parse failed',
            responseSample: text.substring(0, 200)
          }
        });
      }
    } else {
      setDebugInfo({
        directTest: {
          success: false,
          backendUrl,
          error: 'Response is not JSON',
          responseSample: text.substring(0, 200),
          isHtml: text.includes('<!DOCTYPE html>') || text.includes('<html')
        }
      });
    }
  } catch (error) {
    setDebugInfo({
      directTest: {
        success: false,
        backendUrl,
        error: error.message
      }
    });
  }
  
  setShowDebug(true);
};
<button 
  className="btn-secondary"
  onClick={testDirectBackendUrl}
>
  Test Backend Directly
</button>

export default Analytics;