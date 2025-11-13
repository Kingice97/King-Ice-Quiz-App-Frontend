import React, { useState } from 'react';
import { validateQuiz } from '../../../utils/validation';
import './QuizForm.css';

const QuizForm = ({ quiz = null, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: quiz?.title || '',
    description: quiz?.description || '',
    category: quiz?.category || '',
    difficulty: quiz?.difficulty || 'Medium',
    timeLimit: quiz?.timeLimit || 10,
    maxAttempts: quiz?.maxAttempts || 0,
    // NEW: Expiration fields
    autoExpire: quiz?.autoExpire || false,
    expireAfterHours: quiz?.expireAfterHours || 24,
    questions: quiz?.questions || [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 1
      }
    ]
  });
  const [errors, setErrors] = useState({});

  const handleQuizChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    clearError(name);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
    clearError(`questions[${index}].${field}`);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
    clearError(`questions[${qIndex}].options[${oIndex}]`);
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          points: 1
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        questions: newQuestions
      }));
    }
  };

  const addOption = (qIndex) => {
    const newQuestions = [...formData.questions];
    if (newQuestions[qIndex].options.length < 6) {
      newQuestions[qIndex].options.push('');
      setFormData(prev => ({
        ...prev,
        questions: newQuestions
      }));
    }
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...formData.questions];
    if (newQuestions[qIndex].options.length > 2) {
      newQuestions[qIndex].options.splice(oIndex, 1);
      
      // Adjust correct answer if needed
      if (newQuestions[qIndex].correctAnswer >= oIndex) {
        newQuestions[qIndex].correctAnswer = Math.max(0, newQuestions[qIndex].correctAnswer - 1);
      }
      
      setFormData(prev => ({
        ...prev,
        questions: newQuestions
      }));
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateQuiz(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="quiz-form-container">
      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="form-section">
          <h3>Quiz Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quiz Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleQuizChange}
                className={`form-control ${errors.title ? 'error' : ''}`}
                placeholder="Enter quiz title"
                disabled={loading}
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleQuizChange}
                className={`form-control ${errors.category ? 'error' : ''}`}
                placeholder="Enter category"
                disabled={loading}
              />
              {errors.category && <div className="form-error">{errors.category}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleQuizChange}
              className={`form-control ${errors.description ? 'error' : ''}`}
              placeholder="Enter quiz description"
              rows="3"
              disabled={loading}
            />
            {errors.description && <div className="form-error">{errors.description}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleQuizChange}
                className="form-control"
                disabled={loading}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Time Limit (minutes)</label>
              <input
                type="number"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleQuizChange}
                className="form-control"
                min="1"
                max="180"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Attempts</label>
              <input
                type="number"
                name="maxAttempts"
                value={formData.maxAttempts}
                onChange={handleQuizChange}
                className="form-control"
                min="0"
                max="10"
                disabled={loading}
              />
              <div className="form-text">0 = unlimited attempts</div>
            </div>
          </div>

          {/* NEW: Auto-expiration settings */}
          <div className="form-section">
            <h4>Quiz Availability</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="autoExpire"
                    checked={formData.autoExpire}
                    onChange={handleQuizChange}
                    disabled={loading}
                  />
                  Auto-expire quiz after specific time
                </label>
              </div>
            </div>

            {formData.autoExpire && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Expire After (hours)</label>
                  <input
                    type="number"
                    name="expireAfterHours"
                    value={formData.expireAfterHours}
                    onChange={handleQuizChange}
                    className="form-control"
                    min="1"
                    max="720"
                    disabled={loading}
                  />
                  <div className="form-text">
                    Quiz will automatically close after this many hours
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Questions</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="btn btn-outline btn-sm"
              disabled={loading}
            >
              + Add Question
            </button>
          </div>

          {errors.questions && (
            <div className="form-error mb-3">{errors.questions}</div>
          )}

          {formData.questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <h4>Question {qIndex + 1}</h4>
                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="btn btn-danger btn-sm"
                    disabled={loading}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <textarea
                  value={question.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                  className={`form-control ${errors[`questions[${qIndex}].questionText`] ? 'error' : ''}`}
                  placeholder="Enter your question"
                  rows="2"
                  disabled={loading}
                />
                {errors[`questions[${qIndex}].questionText`] && (
                  <div className="form-error">{errors[`questions[${qIndex}].questionText`]}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Options *</label>
                <div className="options-grid">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="option-input-group">
                      <div className="option-input">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className={`form-control ${errors[`questions[${qIndex}].options[${oIndex}]`] ? 'error' : ''}`}
                          placeholder={`Option ${oIndex + 1}`}
                          disabled={loading}
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="btn btn-danger btn-sm"
                            disabled={loading}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                          disabled={loading}
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                </div>
                
                {question.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="btn btn-outline btn-sm"
                    disabled={loading}
                  >
                    + Add Option
                  </button>
                )}

                {errors[`questions[${qIndex}].options`] && (
                  <div className="form-error">{errors[`questions[${qIndex}].options`]}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Points</label>
                <input
                  type="number"
                  value={question.points}
                  onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value))}
                  className="form-control"
                  min="1"
                  max="10"
                  disabled={loading}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? 'Saving...' : (quiz ? 'Update Quiz' : 'Create Quiz')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizForm;