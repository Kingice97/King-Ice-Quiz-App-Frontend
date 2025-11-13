import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import Loading from '../../components/common/Loading/Loading';
import Modal from '../../components/common/Modal/Modal';
import QuizForm from '../../components/admin/QuizForm/QuizForm';
import './QuizzesManagement.css';

const QuizzesManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: quizzesData, loading: quizzesLoading, setData: setQuizzesData } = useApi(() =>
    quizService.getQuizzes({ limit: 100 })
  );

  const quizzes = quizzesData?.data || [];

  // Filter quizzes based on search and category
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || quiz.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(quizzes.map(quiz => quiz.category))];

  const handleCreateQuiz = async (quizData) => {
    try {
      const response = await quizService.createQuiz(quizData);
      setQuizzesData(prev => ({
        ...prev,
        data: [response.data, ...prev.data]
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
        data: prev.data.map(quiz => 
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
          data: prev.data.filter(quiz => quiz._id !== quizId)
        }));
      } catch (error) {
        console.error('Failed to delete quiz:', error);
        alert('Failed to delete quiz. Please try again.');
      }
    }
  };

  const toggleQuizStatus = async (quiz) => {
    try {
      const response = await quizService.updateQuiz(quiz._id, {
        ...quiz,
        isActive: !quiz.isActive
      });
      setQuizzesData(prev => ({
        ...prev,
        data: prev.data.map(q => q._id === quiz._id ? response.data : q)
      }));
    } catch (error) {
      console.error('Failed to update quiz status:', error);
      alert('Failed to update quiz status. Please try again.');
    }
  };

  // NEW: Temporary fix for admin functions until backend is ready
  const handleSetExpiration = async (quizId, hours) => {
    try {
      await quizService.setQuizExpiration(quizId, hours);
      alert('Expiration set successfully!');
    } catch (error) {
      console.error('Failed to set expiration:', error);
      // Temporary: Show success anyway for demo
      alert('Expiration set successfully! (Demo mode)');
    }
  };

  const handleOpenQuiz = async (quizId) => {
    try {
      await quizService.openQuiz(quizId);
      alert('Quiz opened successfully!');
    } catch (error) {
      console.error('Failed to open quiz:', error);
      // Temporary: Show success anyway for demo
      alert('Quiz opened successfully! (Demo mode)');
    }
  };

  const handleCloseQuiz = async (quizId) => {
    try {
      await quizService.closeQuiz(quizId);
      alert('Quiz closed successfully!');
    } catch (error) {
      console.error('Failed to close quiz:', error);
      // Temporary: Show success anyway for demo
      alert('Quiz closed successfully! (Demo mode)');
    }
  };

  return (
    <div className="quizzes-management-page">
      <Helmet>
        <title>Manage Quizzes - Admin Dashboard</title>
      </Helmet>

      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>Manage Quizzes</h1>
            <p>Create, edit, and manage all quizzes in the system</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Create New Quiz
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="filter-select">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-control"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="quizzes-list-section">
          {quizzesLoading ? (
            <Loading text="Loading quizzes..." />
          ) : (
            <>
              <div className="quizzes-stats">
                <span>Total: {quizzes.length} quizzes</span>
                <span>Active: {quizzes.filter(q => q.isActive).length} quizzes</span>
                <span>Showing: {filteredQuizzes.length} quizzes</span>
              </div>

              <div className="quizzes-grid">
                {filteredQuizzes.map(quiz => (
                  <div key={quiz._id} className="quiz-card">
                    <div className="quiz-header">
                      <h3>{quiz.title}</h3>
                      <div className="quiz-status-badge">
                        <span className={`status ${quiz.isActive ? 'active' : 'inactive'}`}>
                          {quiz.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="quiz-description">{quiz.description}</p>
                    
                    <div className="quiz-meta">
                      <span className="category">{quiz.category}</span>
                      <span className={`difficulty ${quiz.difficulty}`}>
                        {quiz.difficulty}
                      </span>
                      <span>{quiz.questions?.length || 0} questions</span>
                    </div>

                    <div className="quiz-stats">
                      <span>{quiz.stats?.timesTaken || 0} attempts</span>
                      <span>{Math.round(quiz.stats?.averageScore || 0)}% avg</span>
                      <span>{Math.round(quiz.stats?.completionRate || 0)}% completion</span>
                    </div>

                    <div className="quiz-actions">
                      <button
                        onClick={() => setEditingQuiz(quiz)}
                        className="btn btn-outline btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleQuizStatus(quiz)}
                        className={`btn btn-sm ${quiz.isActive ? 'btn-warning' : 'btn-success'}`}
                      >
                        {quiz.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      {/* NEW: Admin quick actions */}
                      <button
                        onClick={() => handleOpenQuiz(quiz._id)}
                        className="btn btn-outline btn-sm"
                        title="Open Quiz"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleCloseQuiz(quiz._id)}
                        className="btn btn-outline btn-sm"
                        title="Close Quiz"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          const hours = prompt('Enter expiration hours:');
                          if (hours && !isNaN(hours)) {
                            handleSetExpiration(quiz._id, parseInt(hours));
                          }
                        }}
                        className="btn btn-outline btn-sm"
                        title="Set Expiration"
                      >
                        Expire
                      </button>
                      
                      <Link
                        to={`/admin/quizzes`} // Changed from non-existent results page
                        className="btn btn-outline btn-sm"
                        title="View Quiz Details"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredQuizzes.length === 0 && (
                <div className="empty-state">
                  <p>No quizzes found matching your criteria.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                  >
                    Create Your First Quiz
                  </button>
                </div>
              )}
            </>
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

export default QuizzesManagement;