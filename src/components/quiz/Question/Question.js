import React from 'react';
import './Question.css';

const Question = ({ 
  question, 
  questionNumber, 
  totalQuestions, 
  selectedAnswer, 
  onAnswerSelect,
  showResults = false,
  userAnswer 
}) => {
  const { questionText, options, correctAnswer, explanation } = question;

  const handleOptionClick = (optionIndex) => {
    if (!showResults) {
      onAnswerSelect(optionIndex);
    }
  };

  const getOptionClass = (optionIndex) => {
    if (!showResults) {
      return selectedAnswer === optionIndex ? 'option selected' : 'option';
    }

    // Show results state
    if (optionIndex === correctAnswer) {
      return 'option correct';
    } else if (optionIndex === userAnswer && optionIndex !== correctAnswer) {
      return 'option incorrect';
    } else {
      return 'option';
    }
  };

  return (
    <div className="question-container">
      <div className="question-header">
        <div className="question-progress">
          Question {questionNumber} of {totalQuestions}
        </div>
      </div>

      <div className="question-content">
        <h3 className="question-text">{questionText}</h3>
        
        <div className="options-container">
          {options.map((option, index) => (
            <button
              key={index}
              className={getOptionClass(index)}
              onClick={() => handleOptionClick(index)}
              disabled={showResults}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
              {showResults && (
                <span className="option-status">
                  {index === correctAnswer ? '✓' : index === userAnswer ? '✗' : ''}
                </span>
              )}
            </button>
          ))}
        </div>

        {showResults && explanation && (
          <div className="explanation">
            <strong>Explanation:</strong> {explanation}
          </div>
        )}
      </div>
    </div>
  );
};

export default Question;