import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useQuiz } from '../../../context/QuizContext';
import { quizService } from '../../../services/quizService';
import { getDifficultyBadgeClass, getDifficultyColor } from '../../../utils/helpers';
import './QuizCard.css';

const QuizCard = ({ quiz }) => {
  const { user } = useAuth();
  const { quizHistory, hasCompletedQuiz, getQuizResult } = useQuiz();
  const {
    _id,
    title,
    description,
    category,
    difficulty,
    timeLimit,
    questions = [],
    stats = {},
    createdBy
  } = quiz;

  const [hasCompleted, setHasCompleted] = useState(false);
  const [userScore, setUserScore] = useState(null);
  const [loading, setLoading] = useState(true);

  const difficultyClass = getDifficultyBadgeClass(difficulty);
  const isAdmin = user?.role === 'admin';

  // Check if user has completed this quiz
  useEffect(() => {
    const checkQuizCompletion = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      console.log(`🔍 Checking completion for quiz: ${_id} - "${title}"`);
      
      // Method 1: Check QuizContext first (current session)
      const contextCompleted = hasCompletedQuiz(_id);
      const contextResult = getQuizResult(_id);
      
      if (contextCompleted && contextResult) {
        console.log(`✅ Found in QuizContext - Score: ${contextResult.score}%`);
        setHasCompleted(true);
        setUserScore(contextResult.score);
        setLoading(false);
        return;
      }

      // Method 2: Check localStorage (persistent storage)
      try {
        const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '{}');
        if (completedQuizzes[_id]) {
          console.log(`✅ Found in localStorage - Completed with score: ${completedQuizzes[_id].score}%`);
          setHasCompleted(true);
          setUserScore(completedQuizzes[_id].score);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
      }

      // Method 3: NEW - Check backend/database (cross-device check)
      try {
        console.log(`🔍 Checking backend for quiz completion...`);
        const results = await quizService.getResults({ quizId: _id });
        
        if (results.data && results.data.length > 0) {
          // User has taken this quiz - find their result
          const userResult = results.data.find(result => 
            result.userId?._id === user.id || result.userId === user.id
          );
          
          if (userResult) {
            console.log(`✅ Found in backend - Score: ${userResult.percentage}%`);
            setHasCompleted(true);
            setUserScore(Math.round(userResult.percentage));
            
            // Also update localStorage for future reference
            try {
              const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '{}');
              completedQuizzes[_id] = { 
                score: Math.round(userResult.percentage),
                completedAt: new Date().toISOString()
              };
              localStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
            } catch (e) {
              console.error('Error updating localStorage:', e);
            }
            
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking backend for quiz completion:', error);
      }

      console.log(`❌ Quiz not completed: ${_id}`);
      setHasCompleted(false);
      setLoading(false);
    };

    // Use a small delay to ensure context is loaded
    setTimeout(checkQuizCompletion, 100);
  }, [user, _id, title, quizHistory, hasCompletedQuiz, getQuizResult]);

  if (loading) {
    return (
      <div className="quiz-card loading">
        <div className="quiz-card-header">
          <div className="skeleton skeleton-title"></div>
        </div>
        <div className="quiz-card-body">
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-card">
      <div className="quiz-card-header">
        <h3 className="quiz-title">{title}</h3>
        <div className="quiz-header-right">
          <span className={`difficulty-badge ${difficultyClass}`}>
            {difficulty}
          </span>
          {hasCompleted && (
            <span className="completed-badge" title="You have completed this quiz">
              ✅ Completed
            </span>
          )}
        </div>
      </div>

      <div className="quiz-card-body">
        <p className="quiz-description">{description}</p>

        <div className="quiz-meta">
          <div className="meta-item">
            <span className="meta-label">Category:</span>
            <span className="meta-value">{category}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Questions:</span>
            <span className="meta-value">{questions.length}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Time Limit:</span>
            <span className="meta-value">{timeLimit} min</span>
          </div>
        </div>

        {stats.timesTaken > 0 && (
          <div className="quiz-stats">
            <div className="stat">
              <span className="stat-value">{stats.timesTaken}</span>
              <span className="stat-label">Attempts</span>
            </div>
            <div className="stat">
              <span className="stat-value">{Math.round(stats.averageScore || 0)}%</span>
              <span className="stat-label">Avg. Score</span>
            </div>
            {hasCompleted && userScore !== null && (
              <div className="stat user-score">
                <span className="stat-value">{userScore}%</span>
                <span className="stat-label">Your Score</span>
              </div>
            )}
          </div>
        )}

        {createdBy && (
          <div className="quiz-author">
            Created by {createdBy.username}
          </div>
        )}
      </div>

      <div className="quiz-card-footer">
        {isAdmin ? (
          <div className="admin-view-only">
            <span className="admin-badge">Admin View</span>
            <Link 
              to={`/admin/quizzes`} 
              className="btn btn-outline btn-full"
            >
              Manage Quizzes
            </Link>
          </div>
        ) : hasCompleted ? (
          // For completed quizzes, show disabled "Completed" text
          <div className="completed-state">
            <span className="completed-text">Completed</span>
            {userScore !== null && (
              <span className="completed-score">Score: {userScore}%</span>
            )}
          </div>
        ) : (
          <Link 
            to={`/quiz/${_id}`}
            className="btn btn-primary btn-full"
          >
            Start Quiz
          </Link>
        )}
      </div>
    </div>
  );
};

export default QuizCard;