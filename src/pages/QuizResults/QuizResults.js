import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import Loading from '../../components/common/Loading/Loading';
import './QuizResults.css';

const QuizResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: quizData, loading: quizLoading } = useApi(() =>
    quizService.getQuiz(id)
  );

  // FIXED: Use the correct API endpoint for admin quiz results
const { data: resultsData, loading: resultsLoading } = useApi(() =>
  quizService.getQuizResults(id) // Now this will use the correct endpoint
);

  const quiz = quizData?.data;
  const results = resultsData?.data || [];

  // Filter results to only show this specific quiz
  const quizResults = results.filter(result => result.quizId?._id === id);

  if (quizLoading || resultsLoading) {
    return <Loading overlay={true} text="Loading quiz results..." />;
  }

  return (
    <div className="quiz-results-page">
      <Helmet>
        <title>{quiz?.title ? `${quiz.title} Results` : 'Quiz Results'} - King Ice Quiz App</title>
      </Helmet>

      <div className="container">
        <div className="page-header">
          <button 
            onClick={() => navigate('/admin')}
            className="btn btn-outline"
          >
            ← Back to Admin
          </button>
          <h1>Quiz Results: {quiz?.title || 'Loading...'}</h1>
          <p>View all user attempts for this quiz</p>
        </div>

        <div className="quiz-info-card">
          <div className="quiz-meta">
            <span><strong>Category:</strong> {quiz?.category}</span>
            <span><strong>Difficulty:</strong> {quiz?.difficulty}</span>
            <span><strong>Questions:</strong> {quiz?.questions?.length}</span>
            <span><strong>Total Attempts:</strong> {quizResults.length}</span>
          </div>
        </div>

        {quizResults.length > 0 ? (
          <div className="results-section">
            <div className="section-header">
              <h2>User Attempts ({quizResults.length})</h2>
              <div className="stats-summary">
                <span>Average Score: {Math.round(quizResults.reduce((sum, result) => sum + result.percentage, 0) / quizResults.length)}%</span>
                <span>Pass Rate: {Math.round((quizResults.filter(r => r.passed).length / quizResults.length) * 100)}%</span>
              </div>
            </div>

            <div className="results-table">
              <div className="table-header">
                <span>User</span>
                <span>Score</span>
                <span>Correct Answers</span>
                <span>Time Taken</span>
                <span>Date</span>
                <span>Status</span>
              </div>
              
              {quizResults.map((result, index) => (
                <div key={result._id} className="table-row">
                  <div className="user-cell">
                    <strong>{result.userName}</strong>
                    {result.userId?.profile?.firstName && (
                      <span>{result.userId.profile.firstName} {result.userId.profile.lastName}</span>
                    )}
                  </div>
                  <div className="score-cell">
                    <span className={`score-badge ${result.passed ? 'passed' : 'failed'}`}>
                      {Math.round(result.percentage)}%
                    </span>
                  </div>
                  <div className="answers-cell">
                    {result.score}/{result.totalQuestions}
                  </div>
                  <div className="time-cell">
                    {result.timeTaken}s
                  </div>
                  <div className="date-cell">
                    {new Date(result.completedAt).toLocaleDateString()}
                    <br />
                    <small>{new Date(result.completedAt).toLocaleTimeString()}</small>
                  </div>
                  <div className="status-cell">
                    <span className={`status-badge ${result.passed ? 'passed' : 'failed'}`}>
                      {result.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Results Yet</h3>
            <p>No users have taken this quiz yet.</p>
            <Link to="/admin" className="btn btn-primary">
              Back to Admin Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResults;