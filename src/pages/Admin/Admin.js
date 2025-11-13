import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import { userService } from '../../services/userService';
import QuizForm from '../../components/admin/QuizForm/QuizForm';
import AdminDashboard from '../../components/admin/Dashboard/Dashboard';
import UsersManagement from './UsersManagement';
import Loading from '../../components/common/Loading/Loading';
import Modal from '../../components/common/Modal/Modal';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  // FIXED: Safe data handling with fallbacks
  const { data: quizzesData, loading: quizzesLoading, setData: setQuizzesData } = useApi(async () => {
    try {
      // Try new admin endpoint first, fallback to regular endpoint
      return await quizService.getAdminQuizzes({ limit: 50 });
    } catch (error) {
      console.log('Admin quizzes endpoint not available, using regular endpoint');
      return await quizService.getQuizzes({ limit: 50 });
    }
  });

  const { data: resultsData, loading: resultsLoading } = useApi(async () => {
    try {
      // Try new admin endpoint first, fallback to regular endpoint
      return await quizService.getAdminResults({ limit: 100, sortBy: 'completedAt', sortOrder: 'desc' });
    } catch (error) {
      console.log('Admin results endpoint not available, using regular endpoint');
      return await quizService.getAllResults({ limit: 100, sortBy: 'completedAt', sortOrder: 'desc' });
    }
  });

  const { data: usersData, loading: usersLoading } = useApi(() =>
    userService.getUsers({ limit: 100 })
  );

  const { data: leaderboardData, loading: leaderboardLoading } = useApi(() =>
    userService.getLeaderboard({ limit: 5 })
  );

  // FIXED: Safe data extraction with null checks
  const quizzes = quizzesData?.data || [];
  const recentResults = resultsData?.data || [];
  const users = usersData?.data || [];
  const userLeaderboard = leaderboardData?.data || [];

  // Calculate admin platform stats with safe defaults
  const regularUsers = Array.isArray(users) ? users.filter(user => user.role === 'user') : [];
  const activeRegularUsers = regularUsers.filter(user => user.isActive === true).length;
  
  const adminStats = {
    totalQuizzes: quizzes.length,
    totalUsers: users.length,
    totalAttempts: recentResults.length,
    activeUsers: activeRegularUsers,
    averageScore: recentResults.length > 0 
      ? recentResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / recentResults.length 
      : 0
  };

  // Quiz status management functions
  const handleCloseQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to close this quiz? Users will no longer be able to take it.')) {
      try {
        await quizService.closeQuiz(quizId);
        setQuizzesData(prev => ({
          ...prev,
          data: prev.data.map(quiz => 
            quiz._id === quizId ? { ...quiz, isActive: false, isAvailable: false } : quiz
          )
        }));
        alert('Quiz closed successfully!');
      } catch (error) {
        console.error('Failed to close quiz:', error);
        alert('Failed to close quiz. Please try again.');
      }
    }
  };

  const handleOpenQuiz = async (quizId) => {
    try {
      await quizService.openQuiz(quizId);
      setQuizzesData(prev => ({
        ...prev,
        data: prev.data.map(quiz => 
          quiz._id === quizId ? { ...quiz, isActive: true, isAvailable: true } : quiz
        )
      }));
      alert('Quiz opened successfully!');
    } catch (error) {
      console.error('Failed to open quiz:', error);
      alert('Failed to open quiz. Please try again.');
    }
  };

  const handleSetExpiration = async (quizId) => {
    const hours = prompt('Enter number of hours until quiz expires:');
    if (hours && !isNaN(hours) && hours > 0) {
      try {
        await quizService.setQuizExpiration(quizId, parseInt(hours));
        setQuizzesData(prev => ({
          ...prev,
          data: prev.data.map(quiz => 
            quiz._id === quizId ? { 
              ...quiz, 
              autoExpire: true, 
              expireAfterHours: parseInt(hours),
              expiresAt: new Date(Date.now() + (parseInt(hours) * 60 * 60 * 1000))
            } : quiz
          )
        }));
        alert(`Quiz will expire in ${hours} hours!`);
      } catch (error) {
        console.error('Failed to set expiration:', error);
        alert('Failed to set expiration. Please try again.');
      }
    }
  };

  const handleCreateQuiz = async (quizData) => {
    try {
      const response = await quizService.createQuiz(quizData);
      setQuizzesData(prev => ({
        ...prev,
        data: [response.data, ...(prev?.data || [])]
      }));
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert('Failed to create quiz. Please try again.');
    }
  };

  const handleUpdateQuiz = async (quizData) => {
    try {
      const response = await quizService.updateQuiz(editingQuiz._id, quizData);
      setQuizzesData(prev => ({
        ...prev,
        data: (prev?.data || []).map(quiz => 
          quiz._id === editingQuiz._id ? response.data : quiz
        )
      }));
      setEditingQuiz(null);
    } catch (error) {
      console.error('Failed to update quiz:', error);
      alert('Failed to update quiz. Please try again.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      try {
        await quizService.deleteQuiz(quizId);
        setQuizzesData(prev => ({
          ...prev,
          data: (prev?.data || []).filter(quiz => quiz._id !== quizId)
        }));
      } catch (error) {
        console.error('Failed to delete quiz:', error);
        alert('Failed to delete quiz. Please try again.');
      }
    }
  };

  const startEditing = (quiz) => {
    setEditingQuiz(quiz);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-error">
        <div className="container">
          <div className="error-content">
            <h2>Access Denied</h2>
            <p>You need administrator privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Helmet>
        <title>Admin Dashboard - King Ice Quiz App</title>
        <meta name="description" content="King Ice Quiz App administration dashboard" />
      </Helmet>

      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Platform management and user analytics</p>
          <div className="admin-actions">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create New Quiz
            </button>
            <Link to="/admin/users" className="btn btn-outline">
              Manage Users
            </Link>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="admin-tabs">
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
          >
            📝 Quizzes ({quizzes.length})
          </button>
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users ({regularUsers.length})
          </button>
          <button
            className={`tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            📈 Results ({recentResults.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <AdminDashboard
              stats={adminStats}
              recentQuizzes={quizzes.slice(0, 5)}
              recentResults={recentResults.slice(0, 10)}
              userLeaderboard={userLeaderboard.map(item => ({
                _id: item._id,
                username: item.user?.username || 'Unknown User',
                averageScore: item.averageScore || 0,
                bestScore: item.averageScore || 0,
                quizzesTaken: item.quizzesTaken || 0
              }))}
            />
          )}

          {activeTab === 'quizzes' && (
            <div className="quizzes-management">
              <div className="management-header">
                <h3>Quiz Management</h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  + Create Quiz
                </button>
              </div>
              {quizzesLoading ? (
                <Loading text="Loading quizzes..." />
              ) : (
                <div className="quizzes-list">
                  {quizzes.map(quiz => {
                    const isExpired = quiz.expiresAt && new Date(quiz.expiresAt) < new Date();
                    const isAvailable = quiz.isActive && !isExpired;
                    
                    return (
                      <div key={quiz._id} className="quiz-management-item">
                        <div className="quiz-info">
                          <h4>{quiz.title}</h4>
                          <p>{quiz.description}</p>
                          <div className="quiz-meta">
                            <span className="category">{quiz.category}</span>
                            <span className={`difficulty ${quiz.difficulty}`}>
                              {quiz.difficulty}
                            </span>
                            <span>{quiz.questions?.length || 0} questions</span>
                            <span>{quiz.stats?.timesTaken || 0} attempts</span>
                            <span>{Math.round(quiz.stats?.averageScore || 0)}% avg</span>
                            <span className={`status ${isAvailable ? 'active' : 'inactive'}`}>
                              {isAvailable ? 'Active' : (isExpired ? 'Expired' : 'Inactive')}
                            </span>
                            {quiz.expiresAt && (
                              <span className="expiration">
                                {isExpired ? 'Expired' : `Expires: ${new Date(quiz.expiresAt).toLocaleString()}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="quiz-actions">
                          <button
                            onClick={() => startEditing(quiz)}
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </button>
                          {isAvailable ? (
                            <button
                              onClick={() => handleCloseQuiz(quiz._id)}
                              className="btn btn-warning btn-sm"
                            >
                              Close
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenQuiz(quiz._id)}
                              className="btn btn-success btn-sm"
                            >
                              Open
                            </button>
                          )}
                          <button
                            onClick={() => handleSetExpiration(quiz._id)}
                            className="btn btn-info btn-sm"
                          >
                            Set Expire
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz._id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <UsersManagement />
          )}

          {activeTab === 'results' && (
            <div className="results-management">
              <div className="management-header">
                <h3>Quiz Results</h3>
                <span>Total: {recentResults.length} attempts</span>
              </div>
              {resultsLoading ? (
                <Loading text="Loading results..." />
              ) : recentResults.length > 0 ? (
                <div className="results-list">
                  <div className="results-header">
                    <span>User</span>
                    <span>Quiz</span>
                    <span>Score</span>
                    <span>Time</span>
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  {recentResults.map(result => (
                    <div key={result._id} className="result-item">
                      <div className="result-user">
                        <strong>{result.userName}</strong>
                      </div>
                      <div className="result-quiz">
                        {result.quizId?.title || 'Unknown Quiz'}
                      </div>
                      <div className="result-score">
                        <span className={`score-badge ${result.passed ? 'passed' : 'failed'}`}>
                          {Math.round(result.percentage || 0)}%
                        </span>
                      </div>
                      <div className="result-time">
                        {result.timeTaken}s
                      </div>
                      <div className="result-date">
                        {new Date(result.completedAt || result.createdAt).toLocaleDateString()}
                      </div>
                      <div className="result-status">
                        <span className={`status ${result.passed ? 'passed' : 'failed'}`}>
                          {result.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No quiz results yet.</p>
                  <p>Results will appear here once users take quizzes.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Quiz Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Quiz"
        size="large"
      >
        <QuizForm
          onSubmit={handleCreateQuiz}
          loading={false}
        />
      </Modal>

      {/* Edit Quiz Modal */}
      <Modal
        isOpen={!!editingQuiz}
        onClose={() => setEditingQuiz(null)}
        title="Edit Quiz"
        size="large"
      >
        {editingQuiz && (
          <QuizForm
            quiz={editingQuiz}
            onSubmit={handleUpdateQuiz}
            loading={false}
          />
        )}
      </Modal>
    </div>
  );
};

export default Admin;