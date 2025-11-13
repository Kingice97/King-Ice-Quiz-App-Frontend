import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuiz } from '../../context/QuizContext';
import Result from '../../components/quiz/Result/Result';
import Loading from '../../components/common/Loading/Loading';
import './Result.css';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { quizResults } = useQuiz(); // Removed clearResults

  // Get result from location state or context
  const resultData = location.state?.result || quizResults?.data;
  const quizTitle = location.state?.quizTitle || 'Quiz';

  // Extract summary and answers from the result data structure
  const summary = resultData?.summary || resultData;
  const answers = resultData?.result?.answers || resultData?.answers || [];

  React.useEffect(() => {
    // Redirect if no result data
    if (!resultData) {
      navigate('/quizzes');
    }
  }, [resultData, navigate]);

  // REMOVED: handleRetry function completely

  if (!resultData) {
    return <Loading overlay={true} text="Loading results..." />;
  }

  // Combine summary with answers for the Result component
  const resultForDisplay = {
    ...summary,
    answers: answers
  };

  return (
    <div className="result-page">
      <Helmet>
        <title>Quiz Results - King Ice Quiz App</title>
        <meta name="description" content={`View your results for ${quizTitle}`} />
      </Helmet>

      <div className="container">
        <Result 
          result={resultForDisplay}
          quizTitle={quizTitle}
          // REMOVED: onRetry prop
        />
      </div>
    </div>
  );
};

export default ResultPage;