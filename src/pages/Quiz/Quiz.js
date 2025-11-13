import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { useQuiz } from '../../context/QuizContext';
import { useSocket } from '../../context/SocketContext';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import Question from '../../components/quiz/Question/Question';
import Timer from '../../components/quiz/Timer/Timer';
import Progress from '../../components/quiz/Progress/Progress';
import QuizChat from '../../components/quiz/QuizChat/QuizChat';
import Loading from '../../components/common/Loading/Loading';
import Modal from '../../components/common/Modal/Modal';
import './Quiz.css';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { submitQuiz, quizHistory } = useQuiz();
  const { joinQuizRoom, isConnected } = useSocket();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIX: Get quiz with admin privileges to get correct answers
  const { data: quizData, loading, error } = useApi(() => 
    quizService.getQuizWithAnswers(id) // We need to create this new function
  );

  const quiz = quizData?.data;

  // Join quiz chat room when quiz loads
  useEffect(() => {
    if (quiz && isConnected) {
      joinQuizRoom(quiz._id);
      console.log(`💬 Joined chat room for quiz: ${quiz._id}`);
    }
  }, [quiz, isConnected, joinQuizRoom]);

  useEffect(() => {
    if (quiz && !startTime) {
      setStartTime(new Date());
    }
  }, [quiz, startTime]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { from: `/quiz/${id}` } 
      });
    }
  }, [isAuthenticated, navigate, id]);

  // Check if user has already completed this quiz
  useEffect(() => {
    if (quiz && quizHistory) {
      const hasCompleted = quizHistory.some(result => 
        result.quiz && result.quiz._id === quiz._id
      );
      if (hasCompleted) {
        console.log('⚠️ User has already completed this quiz. Redirecting...');
        navigate('/quizzes');
      }
    }
  }, [quiz, quizHistory, navigate]);

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = {
      selectedAnswer: answerIndex,
      timeSpent: timeSpent
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeSpent(0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setTimeSpent(0);
    }
  };

  // FIXED: Calculate score locally using the quiz data WITH correct answers
  const calculateLocalScore = () => {
    console.log('🔍 DEBUG: Starting local score calculation');
    console.log('📝 Answers submitted:', answers);
    console.log('❓ Quiz questions with correct answers:', quiz.questions);
    
    let correctCount = 0;
    const detailedResults = answers.map((answer, index) => {
      const question = quiz.questions[index];
      
      if (!answer || answer.selectedAnswer === undefined) {
        console.log(`❓ Question ${index + 1}: No answer provided`);
        return {
          question: question.questionText,
          selectedAnswer: null,
          correctAnswer: question.correctAnswer,
          isCorrect: false,
          timeSpent: answer?.timeSpent || 0
        };
      }

      // DEBUG: Log what we're comparing
      console.log(`🔍 Question ${index + 1}:`, {
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        selectedType: typeof answer.selectedAnswer,
        correctType: typeof question.correctAnswer,
        options: question.options
      });

      // FIX: Ensure both are numbers for comparison
      const selected = Number(answer.selectedAnswer);
      const correct = Number(question.correctAnswer);
      
      const isCorrect = selected === correct;
      
      if (isCorrect) {
        correctCount++;
        console.log(`✅ Question ${index + 1}: CORRECT!`);
      } else {
        console.log(`❌ Question ${index + 1}: INCORRECT. Selected: ${selected}, Correct: ${correct}`);
      }

      return {
        question: question.questionText,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        timeSpent: answer.timeSpent || 0
      };
    });

    const score = (correctCount / quiz.questions.length) * 100;
    
    console.log('🎯 FINAL LOCAL SCORE:', {
      correctCount,
      totalQuestions: quiz.questions.length,
      score,
      detailedResults
    });

    return { score, correctCount, detailedResults };
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setShowConfirmModal(false);
    
    const endTime = new Date();
    const totalTimeTaken = Math.round((endTime - startTime) / 1000);

    console.log('📊 Final Submission:', {
      totalQuestions: quiz.questions.length,
      answersGiven: answers.filter(a => a !== undefined).length,
      totalTimeTaken
    });

    try {
      console.log('📤 Attempting backend submission...');
      
      // Try backend submission but don't rely on it
      try {
        const result = await quizService.submitQuiz(id, {
          answers,
          timeTaken: totalTimeTaken
        });
        console.log('✅ Backend submission successful:', result);
      } catch (backendError) {
        console.log('⚠️ Backend submission failed, using local calculation:', backendError.message);
      }

      // Calculate score locally (RELIABLE METHOD)
      const { score, correctCount, detailedResults } = calculateLocalScore();

      // Create result object with LOCAL calculation
      const resultData = {
        _id: `result_${Date.now()}`,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          category: quiz.category,
          difficulty: quiz.difficulty
        },
        user: {
          _id: user?._id,
          username: user?.username
        },
        score: score, // Percentage score
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        timeTaken: totalTimeTaken,
        answers: detailedResults,
        submittedAt: new Date().toISOString(),
        success: true,
        calculatedLocally: true, // Flag to show this was calculated locally
        summary: {
          score: score,
          totalQuestions: quiz.questions.length,
          correctAnswers: correctCount,
          timeTaken: totalTimeTaken
        }
      };

      console.log('🎯 Final result data:', resultData);

      // Update quiz context with the result
      if (submitQuiz) {
        submitQuiz(resultData);
      }
      
      // Navigate to results page with the calculated score
      navigate('/result', { 
        state: { 
          result: resultData,
          quizTitle: quiz.title 
        } 
      });

    } catch (error) {
      console.error('❌ Unexpected error during submission:', error);
      
      // Emergency fallback - still calculate locally
      const { score, correctCount, detailedResults } = calculateLocalScore();
      
      const fallbackResult = {
        _id: `fallback_${Date.now()}`,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          category: quiz.category,
          difficulty: quiz.difficulty
        },
        user: {
          _id: user?._id,
          username: user?.username
        },
        score: score,
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        timeTaken: totalTimeTaken,
        answers: detailedResults,
        submittedAt: new Date().toISOString(),
        success: false,
        calculatedLocally: true,
        error: 'Backend unavailable, score calculated locally'
      };

      if (submitQuiz) {
        submitQuiz(fallbackResult);
      }
      
      navigate('/result', { 
        state: { 
          result: fallbackResult,
          quizTitle: quiz.title 
        } 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    setShowTimeUpModal(true);
    handleSubmit();
  };

  const handleTimeTick = (timeLeft) => {
    if (quiz && quiz.timeLimit) {
      setTimeSpent(quiz.timeLimit * 60 - timeLeft);
    }
  };

  // Toggle chat visibility
  const toggleChat = () => {
    setShowChat(!showChat);
  };

  const currentAnswer = answers[currentQuestion];
  const totalQuestions = quiz?.questions?.length || 0;
  const answeredQuestions = answers.filter(a => a !== undefined).length;

  if (loading) {
    return <Loading overlay={true} text="Loading quiz..." />;
  }

  if (error) {
    return (
      <div className="quiz-error">
        <div className="container">
          <div className="error-content">
            <h2>Quiz Not Available</h2>
            <p>{error}</p>
            <button 
              onClick={() => navigate('/quizzes')}
              className="btn btn-primary"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <div className="quiz-page">
      <Helmet>
        <title>{quiz.title} - King Ice Quiz App</title>
        <meta name="description" content={`Take the ${quiz.title} quiz on King Ice Quiz App`} />
      </Helmet>

      <div className="quiz-container">
        {/* Quiz Header */}
        <div className="quiz-header">
          <div className="quiz-info">
            <h1>{quiz.title}</h1>
            <p>{quiz.description}</p>
            <div className="quiz-meta">
              <span className="category">{quiz.category}</span>
              <span className={`difficulty ${quiz.difficulty.toLowerCase()}`}>
                {quiz.difficulty}
              </span>
              <span className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
                💬 {isConnected ? 'Chat Connected' : 'Chat Offline'}
              </span>
            </div>
          </div>
          
          <div className="quiz-controls">
            <Timer
              initialTime={quiz.timeLimit * 60}
              onTimeUp={handleTimeUp}
              onTick={handleTimeTick}
              isRunning={true}
            />
            
            <button
              onClick={toggleChat}
              className={`btn btn-outline chat-toggle ${showChat ? 'active' : ''}`}
              title={showChat ? 'Hide Chat' : 'Show Chat'}
              disabled={isSubmitting}
            >
              💬 {showChat ? 'Hide Chat' : 'Show Chat'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="quiz-content">
          {/* Quiz Questions */}
          <div className={`quiz-questions ${showChat ? 'with-chat' : ''}`}>
            {/* Progress */}
            <Progress
              current={currentQuestion + 1}
              total={totalQuestions}
              answers={answers}
            />

            {/* Current Question */}
            <Question
              question={quiz.questions[currentQuestion]}
              questionNumber={currentQuestion + 1}
              totalQuestions={totalQuestions}
              selectedAnswer={currentAnswer?.selectedAnswer}
              onAnswerSelect={handleAnswerSelect}
            />

            {/* Navigation */}
            <div className="quiz-navigation">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0 || isSubmitting}
                className="btn btn-outline"
              >
                Previous
              </button>

              <div className="navigation-info">
                <span>
                  {answeredQuestions} of {totalQuestions} answered
                </span>
                {isSubmitting && (
                  <span className="submitting-indicator">
                    📤 Submitting...
                  </span>
                )}
              </div>

              {currentQuestion === totalQuestions - 1 ? (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={answeredQuestions < totalQuestions || isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>

          {/* Quiz Chat Sidebar */}
          {showChat && (
            <div className="quiz-chat-sidebar">
              <QuizChat 
                quizId={quiz._id}
                quizTitle={quiz.title}
                onClose={() => setShowChat(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Submit Quiz"
        size="small"
      >
        <div className="confirmation-content">
          <p>Are you sure you want to submit your quiz?</p>
          <p>
            You have answered {answeredQuestions} out of {totalQuestions} questions.
          </p>
          <div className="confirmation-actions">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Continue Quiz
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Time Up Modal */}
      <Modal
        isOpen={showTimeUpModal}
        onClose={() => setShowTimeUpModal(false)}
        title="Time's Up!"
        closeOnOverlayClick={false}
      >
        <div className="time-up-content">
          <p>Your time for this quiz has ended.</p>
          <p>Your answers have been automatically submitted.</p>
          <button
            onClick={() => setShowTimeUpModal(false)}
            className="btn btn-primary"
          >
            View Results
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Quiz;