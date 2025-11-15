import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import { userService } from '../../services/userService';
import QuizCard from '../../components/quiz/QuizCard/QuizCard';
import Loading from '../../components/common/Loading/Loading';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { data: quizzesData, loading: quizzesLoading } = useApi(() => 
    quizService.getQuizzes({ limit: 6 })
  );
  const { data: leaderboardData, loading: leaderboardLoading } = useApi(() =>
    userService.getLeaderboard({ limit: 5 })
  );
  const { data: usersData, loading: usersLoading } = useApi(() =>
    userService.getUsers({ limit: 100 })
  );
  const { data: resultsData, loading: resultsLoading } = useApi(() =>
    quizService.getRecentResults({ limit: 100 })
  );

  const featuredQuizzes = quizzesData?.data || [];
  const leaderboard = leaderboardData?.data || [];
  const users = usersData?.data || [];
  const results = resultsData?.data || [];

  // Calculate stats for admin dashboard - EXCLUDE ADMIN USERS
  const activeQuizzes = featuredQuizzes.length; // FIXED: This shows active quizzes (not expired)
  const regularUsers = users.filter(user => user.role === 'user');
  const totalUsers = regularUsers.length; // Only regular users, no admin
  const totalAttempts = results.length; // FIXED: This now shows actual total attempts (19)
  
  // Calculate active users (only regular users, no admin)
  const activeUsers = regularUsers.filter(user => 
    user.isActive === true || 
    (user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  ).length;

  // If user is admin, show admin-specific content
  if (isAdmin) {
    return (
      <div className="home">
        {/* Admin Hero Section */}
        <section className="hero admin-hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Welcome to Admin Dashboard</h1>
              <p>
                Manage your quiz platform, track user activity, and create engaging content 
                for your community. Access comprehensive analytics and platform controls.
              </p>
              <div className="hero-actions">
                <Link to="/admin" className="btn btn-primary btn-lg">
                  Go to Admin Dashboard
                </Link>
                <Link to="/admin/quizzes" className="btn btn-outline btn-lg">
                  Manage Quizzes
                </Link>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-graphic admin-graphic">
                <span className="graphic-icon">⚙️</span>
              </div>
            </div>
          </div>
        </section>

        {/* Admin Quick Stats */}
        <section className="admin-stats">
          <div className="container">
            <h2>Platform Overview</h2>
            {(quizzesLoading || usersLoading || resultsLoading) ? (
              <Loading text="Loading platform stats..." />
            ) : (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <span className="stat-value">{activeQuizzes}</span>
                    <span className="stat-label">Active Quizzes</span> {/* FIXED: Changed from "Total Quizzes" to "Active Quizzes" */}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <span className="stat-value">{totalUsers}</span>
                    <span className="stat-label">Total Users</span>
                    <small style={{fontSize: '10px', color: '#6c757d', marginTop: '4px'}}>
                      (Regular users only)
                    </small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <span className="stat-value">{totalAttempts}</span> {/* FIXED: Now shows actual total attempts (19) */}
                    <span className="stat-label">Total Attempts</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-info">
                    <span className="stat-value">{activeUsers}</span>
                    <span className="stat-label">Active Users</span>
                    <small style={{fontSize: '10px', color: '#6c757d', marginTop: '4px'}}>
                      (Regular users only)
                    </small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Admin Quick Actions */}
        <section className="admin-actions">
          <div className="container">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/admin/quizzes" className="action-card">
                <div className="action-icon">📝</div>
                <div className="action-content">
                  <h3>Manage Quizzes</h3>
                  <p>Create, edit, and organize all quizzes in the system</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
              <Link to="/admin/users" className="action-card">
                <div className="action-icon">👥</div>
                <div className="action-content">
                  <h3>User Management</h3>
                  <p>View and manage all registered users and their activity</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
              <Link to="/admin/results" className="action-card">
                <div className="action-icon">📈</div>
                <div className="action-content">
                  <h3>View Results</h3>
                  <p>Analyze quiz attempts and user performance data</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
              <Link to="/admin/analytics" className="action-card">
                <div className="action-icon">📊</div>
                <div className="action-content">
                  <h3>Platform Analytics</h3>
                  <p>Access detailed reports and platform insights</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Activity Preview */}
        {featuredQuizzes.length > 0 && (
          <section className="recent-activity">
            <div className="container">
              <div className="section-header">
                <h2>Recent Quizzes</h2>
                <Link to="/admin/quizzes" className="btn btn-outline">
                  Manage All Quizzes
                </Link>
              </div>
              
              {quizzesLoading ? (
                <Loading text="Loading quizzes..." />
              ) : (
                <div className="quizzes-grid">
                  {featuredQuizzes.slice(0, 3).map(quiz => (
                    <QuizCard key={quiz._id} quiz={quiz} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Regular user home page
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Test Your Knowledge with King Ice Quiz App</h1>
            <p>
              Challenge yourself with thousands of quizzes across various categories. 
              Compete with others, track your progress, and become a quiz lord!
              <strong> Now with real-time chat!</strong>
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/quizzes" className="btn btn-primary btn-lg">
                  Browse Quizzes
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-graphic">
              <span className="graphic-icon">🧠</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why Choose King Ice Quiz App?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Diverse Categories</h3>
              <p>From science to entertainment, we have quizzes for every interest and knowledge level.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Feedback</h3>
              <p>Get immediate results with detailed explanations and performance analytics.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Compete & Learn</h3>
              <p>Climb the leaderboards, earn achievements, and track your learning progress.</p>
            </div>
            {/* NEW: Chat Feature */}
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Real-time Chat</h3>
              <p>Chat with other quiz enthusiasts, discuss questions, and share knowledge in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Quizzes */}
      <section className="featured-quizzes">
        <div className="container">
          <div className="section-header">
            <h2>Featured Quizzes</h2>
            <Link to="/quizzes" className="btn btn-outline">
              View All Quizzes
            </Link>
          </div>
          
          {quizzesLoading ? (
            <Loading text="Loading quizzes..." />
          ) : (
            <div className="quizzes-grid">
              {featuredQuizzes.map(quiz => (
                <QuizCard key={quiz._id} quiz={quiz} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard Section */}
      {leaderboard.length > 0 && (
        <section className="leaderboard">
          <div className="container">
            <h2>Top Performers</h2>
            {leaderboardLoading ? (
              <Loading text="Loading leaderboard..." />
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((item, index) => (
                  <div key={item._id} className="leaderboard-item">
                    <div className="rank">#{index + 1}</div>
                    <div className="user-info">
                      <span className="username">{item.user?.username}</span>
                      <span className="stats">
                        {Math.round(item.averageScore)}% avg • {item.quizzesTaken} quizzes
                      </span>
                    </div>
                    <div className="score">{Math.round(item.averageScore)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Start Your Quiz Journey?</h2>
              <p>Join thousands of learners testing their knowledge every day. <strong>Chat with the community in real-time!</strong></p>
              <div className="cta-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Create Free Account
                </Link>
                <Link to="/quizzes" className="btn btn-outline btn-lg">
                  Browse as Guest
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;