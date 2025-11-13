import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import QuizCard from '../../components/quiz/QuizCard/QuizCard';
import Loading from '../../components/common/Loading/Loading';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect admins to admin dashboard automatically
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  // Only fetch data for regular users (not admins)
  const { data: statsData, loading: statsLoading } = useApi(() =>
    user?.role !== 'admin' ? quizService.getUserStats() : Promise.resolve({ data: { overall: {} } })
  );
  
  const { data: resultsData, loading: resultsLoading } = useApi(() =>
    user?.role !== 'admin' ? quizService.getResults({ limit: 10 }) : Promise.resolve({ data: [] })
  );
  
  const { data: quizzesData, loading: quizzesLoading } = useApi(() =>
    user?.role !== 'admin' ? quizService.getQuizzes({ limit: 6 }) : Promise.resolve({ data: [] })
  );

  const stats = statsData?.data?.overall || {};
  const categoryStats = statsData?.data?.byCategory || [];
  const recentResults = resultsData?.data || [];
  const recommendedQuizzes = quizzesData?.data || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Show loading while checking user role
  if (user?.role === 'admin') {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Redirecting to Admin Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Helmet>
        <title>Dashboard - King Ice Quiz App</title>
        <meta name="description" content="Your King Ice Quiz App dashboard" />
      </Helmet>

      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.username}! 👋</h1>
          <p>Here's your learning progress and recommended quizzes</p>
        </div>

        {/* Quick Stats */}
        {!statsLoading && (
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalQuizzesTaken || 0}</span>
                <span className="stat-label">Quizzes Taken</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <span className="stat-value">{Math.round(stats.averageScore || 0)}%</span>
                <span className="stat-label">Average Score</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <span className="stat-value">{Math.round(stats.bestScore || 0)}%</span>
                <span className="stat-label">Best Score</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <span className="stat-value">{Math.floor((stats.totalTimeSpent || 0) / 60)}</span>
                <span className="stat-label">Minutes Learning</span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Quiz History
          </button>
          <button
            className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Recommended Quizzes */}
              <section className="recommended-section">
                <div className="section-header">
                  <h2>Recommended Quizzes</h2>
                  <Link to="/quizzes" className="btn btn-outline">
                    Browse All
                  </Link>
                </div>
                {quizzesLoading ? (
                  <Loading text="Loading quizzes..." />
                ) : (
                  <div className="quizzes-grid">
                    {recommendedQuizzes.map(quiz => (
                      <QuizCard key={quiz._id} quiz={quiz} />
                    ))}
                  </div>
                )}
              </section>

              {/* Recent Activity */}
              <section className="recent-activity">
                <h2>Recent Activity</h2>
                {resultsLoading ? (
                  <Loading text="Loading recent activity..." />
                ) : recentResults.length > 0 ? (
                  <div className="activity-list">
                    {recentResults.map(result => (
                      <div key={result._id} className="activity-item">
                        <div className="activity-icon">📝</div>
                        <div className="activity-info">
                          <p>
                            Completed <strong>{result.quizId?.title}</strong>
                          </p>
                          <span className="activity-meta">
                            Score: {Math.round(result.percentage)}% • {formatDate(result.completedAt)}
                          </span>
                        </div>
                        <div className={`activity-score ${result.passed ? 'passed' : 'failed'}`}>
                          {Math.round(result.percentage)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No recent activity. Take your first quiz!</p>
                    <Link to="/quizzes" className="btn btn-primary">
                      Browse Quizzes
                    </Link>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-tab">
              <h2>Quiz History</h2>
              {resultsLoading ? (
                <Loading text="Loading quiz history..." />
              ) : recentResults.length > 0 ? (
                <div className="history-list">
                  {recentResults.map(result => (
                    <div key={result._id} className="history-item">
                      <div className="quiz-info">
                        <h4>{result.quizId?.title}</h4>
                        <p>{result.quizId?.category} • {result.quizId?.difficulty}</p>
                        <span className="attempt-date">
                          Attempted on {formatDate(result.completedAt)}
                        </span>
                      </div>
                      <div className="result-info">
                        <div className={`score ${result.passed ? 'passed' : 'failed'}`}>
                          {Math.round(result.percentage)}%
                        </div>
                        <div className="score-details">
                          {result.score}/{result.totalQuestions} correct
                        </div>
                        <div className="time-taken">
                          {result.timeTaken}s
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No quiz history yet. Start learning!</p>
                  <Link to="/quizzes" className="btn btn-primary">
                    Take a Quiz
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="progress-tab">
              <h2>Learning Progress</h2>
              {statsLoading ? (
                <Loading text="Loading progress data..." />
              ) : (
                <div className="progress-content">
                  {/* Category Performance */}
                  {categoryStats.length > 0 && (
                    <div className="category-performance">
                      <h3>Performance by Category</h3>
                      <div className="category-list">
                        {categoryStats.map(category => (
                          <div key={category._id} className="category-item">
                            <div className="category-header">
                              <span className="category-name">{category._id}</span>
                              <span className="category-score">
                                {Math.round(category.averageScore)}%
                              </span>
                            </div>
                            <div className="category-stats">
                              <span>{category.quizzesTaken} quizzes</span>
                              <span>Best: {Math.round(category.bestScore)}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${category.averageScore}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overall Progress */}
                  <div className="overall-progress">
                    <h3>Overall Statistics</h3>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <label>Success Rate</label>
                        <span>{Math.round(stats.successRate || 0)}%</span>
                      </div>
                      <div className="stat-item">
                        <label>Total Learning Time</label>
                        <span>{Math.floor((stats.totalTimeSpent || 0) / 60)} minutes</span>
                      </div>
                      <div className="stat-item">
                        <label>Quizzes Passed</label>
                        <span>{stats.passedQuizzes || 0}</span>
                      </div>
                      <div className="stat-item">
                        <label>Average Time per Quiz</label>
                        <span>{Math.round((stats.totalTimeSpent || 0) / (stats.totalQuizzesTaken || 1))}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;