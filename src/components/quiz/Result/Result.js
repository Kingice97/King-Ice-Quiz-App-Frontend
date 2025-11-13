import React from 'react';
import { Link } from 'react-router-dom';
import { formatTimeTaken, calculatePercentage } from '../../../utils/helpers';
import './Result.css';

const Result = ({ result, quizTitle }) => {
  console.log('🎯 Result component received:', { result, quizTitle });

  // Safely extract data with fallbacks
  const {
    score = 0,
    totalQuestions = 0,
    correctAnswers = 0,
    timeTaken = 0,
    answers = [],
    calculatedLocally = false,
    success = true
  } = result || {};

  // Calculate percentage from score (score is already percentage)
  const percentage = score;
  const passed = percentage >= 70;

  console.log('📊 Displaying result:', {
    score,
    totalQuestions,
    correctAnswers,
    percentage,
    passed
  });

  return (
    <div className="result-container">
      <div className="result-header">
        <h2>Quiz Completed!</h2>
        <p className="quiz-title">{quizTitle}</p>
        {calculatedLocally && (
          <div className="local-calculation-badge">
            ⚠️ Score calculated locally
          </div>
        )}
        {!success && (
          <div className="warning-badge">
            ⚠️ Backend temporarily unavailable
          </div>
        )}
      </div>

      <div className="result-summary">
        <div className={`result-score ${passed ? 'passed' : 'failed'}`}>
          <div className="score-circle">
            <span className="score-percentage">{Math.round(percentage)}%</span>
            <span className="score-text">Score</span>
          </div>
          <div className="score-details">
            <h3>{passed ? 'Congratulations! 🎉' : 'Keep Trying! 💪'}</h3>
            <p>
              You scored {correctAnswers} out of {totalQuestions} questions correctly.
            </p>
            {calculatedLocally && (
              <p className="info-text">
                Note: Score calculated locally. Your result will be saved to your history.
              </p>
            )}
          </div>
        </div>

        <div className="result-stats">
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-value">{correctAnswers}</span>
              <span className="stat-label">Correct</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-info">
              <span className="stat-value">{totalQuestions - correctAnswers}</span>
              <span className="stat-label">Incorrect</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <span className="stat-value">{formatTimeTaken(timeTaken)}</span>
              <span className="stat-label">Time Taken</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <span className="stat-value">{Math.round(percentage)}%</span>
              <span className="stat-label">Percentage</span>
            </div>
          </div>
        </div>
      </div>

      <div className="result-actions">
        <Link to="/quizzes" className="btn btn-primary btn-lg">
          Browse More Quizzes
        </Link>
        <Link to="/dashboard" className="btn btn-outline btn-lg">
          View Dashboard
        </Link>
      </div>

      {answers.length > 0 && (
        <div className="result-breakdown">
          <h3>Question Breakdown</h3>
          <div className="questions-list">
            {answers.map((answer, index) => {
              const isCorrect = answer?.isCorrect || false;
              
              return (
                <div 
                  key={index} 
                  className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}
                >
                  <div className="question-status">
                    {isCorrect ? '✅' : '❌'}
                  </div>
                  <div className="question-info">
                    <span className="question-number">Question {index + 1}</span>
                    <span className="question-time">
                      Time: {answer?.timeSpent || 0}s
                    </span>
                  </div>
                  {answer?.selectedAnswer !== undefined && answer?.selectedAnswer !== null && (
                    <div className="question-answer">
                      <span>Your answer: {answer.selectedAnswer + 1}</span>
                      {answer?.correctAnswer !== undefined && (
                        <span className="correct-answer">
                          Correct answer: {answer.correctAnswer + 1}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Result;