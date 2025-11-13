import React from 'react';
import './QuestionForm.css';

const QuestionForm = ({ 
  question, 
  onChange, 
  onRemove, 
  index, 
  canRemove,
  disabled 
}) => {
  const handleQuestionChange = (field, value) => {
    onChange(index, field, value);
  };

  const handleOptionChange = (optionIndex, value) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    handleQuestionChange('options', newOptions);
  };

  const addOption = () => {
    if (question.options.length < 6) {
      const newOptions = [...question.options, ''];
      handleQuestionChange('options', newOptions);
    }
  };

  const removeOption = (optionIndex) => {
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      handleQuestionChange('options', newOptions);
      
      // Adjust correct answer if needed
      if (question.correctAnswer >= optionIndex) {
        handleQuestionChange('correctAnswer', Math.max(0, question.correctAnswer - 1));
      }
    }
  };

  return (
    <div className="question-form">
      <div className="question-header">
        <h4>Question {index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="btn btn-danger btn-sm"
            disabled={disabled}
          >
            Remove Question
          </button>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Question Text</label>
        <textarea
          value={question.questionText}
          onChange={(e) => handleQuestionChange('questionText', e.target.value)}
          className="form-control"
          placeholder="Enter your question"
          rows="3"
          disabled={disabled}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Options</label>
        <div className="options-list">
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="option-row">
              <div className="option-input">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                  className="form-control"
                  placeholder={`Option ${optionIndex + 1}`}
                  disabled={disabled}
                />
                {question.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(optionIndex)}
                    className="btn btn-danger btn-sm"
                    disabled={disabled}
                  >
                    ×
                  </button>
                )}
              </div>
              <label className="radio-label">
                <input
                  type="radio"
                  name={`correct-${index}`}
                  checked={question.correctAnswer === optionIndex}
                  onChange={() => handleQuestionChange('correctAnswer', optionIndex)}
                  disabled={disabled}
                />
                Correct Answer
              </label>
            </div>
          ))}
        </div>
        
        {question.options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="btn btn-outline btn-sm"
            disabled={disabled}
          >
            + Add Option
          </button>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Points</label>
          <input
            type="number"
            value={question.points}
            onChange={(e) => handleQuestionChange('points', parseInt(e.target.value))}
            className="form-control"
            min="1"
            max="10"
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Explanation (Optional)</label>
          <textarea
            value={question.explanation || ''}
            onChange={(e) => handleQuestionChange('explanation', e.target.value)}
            className="form-control"
            placeholder="Add explanation for the correct answer"
            rows="2"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;