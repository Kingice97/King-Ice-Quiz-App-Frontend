import React, { createContext, useState, useContext, useEffect } from 'react';

const QuizContext = createContext();

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export const QuizProvider = ({ children }) => {
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load quiz history from localStorage on component mount
  useEffect(() => {
    const loadQuizHistory = () => {
      try {
        const savedHistory = localStorage.getItem('quizHistory');
        if (savedHistory) {
          const history = JSON.parse(savedHistory);
          setQuizHistory(history);
          console.log('📚 Loaded quiz history from localStorage:', history.length, 'quizzes');
        }
      } catch (error) {
        console.error('Error loading quiz history from localStorage:', error);
      }
    };

    loadQuizHistory();
  }, []);

  // Save quiz history to localStorage whenever it changes
  useEffect(() => {
    if (quizHistory.length > 0) {
      try {
        localStorage.setItem('quizHistory', JSON.stringify(quizHistory));
        console.log('💾 Saved quiz history to localStorage:', quizHistory.length, 'quizzes');
      } catch (error) {
        console.error('Error saving quiz history to localStorage:', error);
      }
    }
  }, [quizHistory]);

  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setQuizResults(null);
  };

  const submitQuiz = (results) => {
    console.log('📝 Adding quiz result to history:', {
      quizId: results.quiz?._id,
      score: results.score,
      quizTitle: results.quiz?.title,
      resultId: results._id
    });

    // Store in completedQuizzes for easy access by QuizCard
    if (results.quiz && results.quiz._id) {
      try {
        const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '{}');
        completedQuizzes[results.quiz._id] = {
          score: results.score,
          title: results.quiz.title,
          completedAt: new Date().toISOString(),
          resultId: results._id // Store the result ID for linking
        };
        localStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
        console.log('✅ Marked quiz as completed in localStorage:', results.quiz._id);
      } catch (error) {
        console.error('Error storing completed quiz:', error);
      }
    }

    setQuizResults(results);
    
    // Add to history if not already there (prevent duplicates)
    setQuizHistory(prev => {
      const existingIndex = prev.findIndex(item => 
        item.quiz && item.quiz._id === results.quiz?._id
      );
      
      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = results;
        return updated;
      } else {
        // Add new entry
        return [results, ...prev];
      }
    });
    
    setCurrentQuiz(null);
  };

  const clearCurrentQuiz = () => {
    setCurrentQuiz(null);
  };

  const clearResults = () => {
    setQuizResults(null);
  };

  // Check if a specific quiz has been completed
  const hasCompletedQuiz = (quizId) => {
    return quizHistory.some(result => 
      result.quiz && result.quiz._id === quizId
    );
  };

  // Get result for a specific quiz
  const getQuizResult = (quizId) => {
    return quizHistory.find(result => 
      result.quiz && result.quiz._id === quizId
    );
  };

  // Get all completed quiz IDs
  const getCompletedQuizIds = () => {
    return quizHistory
      .filter(result => result.quiz && result.quiz._id)
      .map(result => result.quiz._id);
  };

  const value = {
    currentQuiz,
    quizResults,
    quizHistory,
    loading,
    setLoading,
    startQuiz,
    submitQuiz,
    clearCurrentQuiz,
    clearResults,
    hasCompletedQuiz,
    getQuizResult,
    getCompletedQuizIds
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};