import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import Loading from '../../components/common/Loading/Loading';
import './ResultsManagement.css';

const ResultsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // FIXED: Use getAllResults for admin to see all results
  const { data: resultsData, loading: resultsLoading } = useApi(() =>
    quizService.getAllResults({ limit: 100, sortBy: 'completedAt', sortOrder: 'desc' })
  );

  const results = resultsData?.data || [];

  // Filter results based on search and filters
  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.quizId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || 
      new Date(result.completedAt).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'passed' && result.passed) ||
      (statusFilter === 'failed' && !result.passed);
    
    return matchesSearch && matchesDate && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="results-management-page">
      <Helmet>
        <title>Quiz Results - Admin Dashboard</title>
      </Helmet>

      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>Quiz Results Management</h1>
            <p>View and analyze all quiz attempts and results from your quizzes</p>
          </div>
          <div className="header-stats">
            <span>Total: {results.length} attempts</span>
            <span>Passed: {results.filter(r => r.passed).length}</span>
            <span>Failed: {results.filter(r => !r.passed).length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by user or quiz..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="filter-group">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-control"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
            >
              <option value="">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Results Table */}
        <div className="results-section">
          {resultsLoading ? (
            <Loading text="Loading results..." />
          ) : (
            <>
              <div className="results-stats">
                <span>Showing: {filteredResults.length} of {results.length} results</span>
                <span>
                  Average Score: {filteredResults.length > 0 
                    ? Math.round(filteredResults.reduce((sum, result) => sum + result.percentage, 0) / filteredResults.length)
                    : 0
                  }%
                </span>
                <span>
                  Pass Rate: {filteredResults.length > 0 
                    ? Math.round((filteredResults.filter(r => r.passed).length / filteredResults.length) * 100)
                    : 0
                  }%
                </span>
              </div>

              {/* FIXED: Added results-table-wrapper for horizontal scrolling */}
              <div className="results-table-wrapper">
                <div className="results-table">
                  <div className="table-header">
                    <div className="header-cell user">User</div>
                    <div className="header-cell quiz">Quiz</div>
                    <div className="header-cell score">Score</div>
                    <div className="header-cell time">Time</div>
                    <div className="header-cell date">Date</div>
                    <div className="header-cell status">Status</div>
                  </div>

                  <div className="table-body">
                    {filteredResults.map(result => (
                      <div key={result._id} className="table-row">
                        <div className="cell user-cell">
                          <strong>{result.userName}</strong>
                          {result.userId?.profile?.firstName && (
                            <small>{result.userId.profile.firstName} {result.userId.profile.lastName}</small>
                          )}
                        </div>
                        <div className="cell quiz-cell">
                          <strong>{result.quizId?.title || 'Unknown Quiz'}</strong>
                          <small>{result.quizId?.category} • {result.quizId?.difficulty}</small>
                        </div>
                        <div className="cell score-cell">
                          <span className={`score-badge ${result.passed ? 'passed' : 'failed'}`}>
                            {Math.round(result.percentage)}%
                          </span>
                          <small>{result.score}/{result.totalQuestions} correct</small>
                        </div>
                        <div className="cell time-cell">
                          {formatTime(result.timeTaken)}
                        </div>
                        <div className="cell date-cell">
                          {formatDate(result.completedAt)}
                        </div>
                        <div className="cell status-cell">
                          <span className={`status ${result.passed ? 'passed' : 'failed'}`}>
                            {result.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredResults.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">📊</div>
                      <h3>No Results Found</h3>
                      <p>
                        {results.length === 0 
                          ? "No quiz results yet. Results will appear here once users start taking your quizzes."
                          : "No results match your search criteria. Try adjusting your filters."
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsManagement;