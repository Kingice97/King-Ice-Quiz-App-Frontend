import React, { useState, useEffect } from 'react';
import './QuestionsManagement.css';

const QuestionsManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    category: '',
    difficulty: 'medium',
    points: 1
  });

  useEffect(() => {
    // Simulate API call to get questions
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from your backend
        // const response = await fetch('/api/questions');
        // const data = await response.json();
        // setQuestions(data.data || []);
        
        // For now, return empty array - no pre-populated questions
        setTimeout(() => {
          setQuestions([]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setQuestions([]);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    if (!newQuestion.category.trim()) {
      alert('Please enter a category');
      return;
    }
    
    if (!newQuestion.correctAnswer.toString().trim()) {
      alert('Please enter a correct answer');
      return;
    }

    if (newQuestion.type === 'multiple-choice') {
      const emptyOptions = newQuestion.options.filter(opt => !opt.trim());
      if (emptyOptions.length > 0) {
        alert('Please fill in all options');
        return;
      }
    }

    try {
      // In a real app, you would send to backend
      // const response = await fetch('/api/questions', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify(newQuestion)
      // });
      // const result = await response.json();
      
      // For now, add to local state
      const question = {
        id: Date.now(), // Temporary ID
        ...newQuestion,
        createdBy: 'current-admin-id',
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      setQuestions([...questions, question]);
      
      // Reset form
      setNewQuestion({
        question: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        category: '',
        difficulty: 'medium',
        points: 1
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question');
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({...newQuestion, options: updatedOptions});
  };

  const deleteQuestion = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        // In a real app, you would call your backend
        // await fetch(`/api/questions/${id}`, {
        //   method: 'DELETE',
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('token')}`
        //   }
        // });
        
        setQuestions(questions.filter(question => question.id !== id));
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
  };

  const addOption = () => {
    if (newQuestion.options.length < 6) {
      setNewQuestion({
        ...newQuestion,
        options: [...newQuestion.options, '']
      });
    }
  };

  const removeOption = (index) => {
    if (newQuestion.options.length > 2) {
      const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions,
        // Adjust correct answer if needed
        correctAnswer: newQuestion.correctAnswer >= index ? Math.max(0, newQuestion.correctAnswer - 1) : newQuestion.correctAnswer
      });
    }
  };

  if (loading) {
    return (
      <div className="questions-management">
        <div className="management-header">
          <h1>Manage Questions</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="questions-management">
      <div className="management-header">
        <h1>Manage Questions</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Add New Question
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form-overlay">
          <div className="create-form">
            <h2>Create New Question</h2>
            <form onSubmit={handleCreateQuestion}>
              <div className="form-group">
                <label>Question Text: *</label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                  required
                  placeholder="Enter your question here..."
                />
              </div>
              
              <div className="form-group">
                <label>Question Type: *</label>
                <select
                  value={newQuestion.type}
                  onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="text">Text Answer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category: *</label>
                <input
                  type="text"
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                  required
                  placeholder="e.g., JavaScript, Math, History"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Difficulty: *</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Points: *</label>
                  <input
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value) || 1})}
                    min="1"
                    max="10"
                    required
                  />
                </div>
              </div>

              {newQuestion.type === 'multiple-choice' && (
                <div className="form-group">
                  <label>Options: *</label>
                  <div className="options-list">
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="option-item">
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          required
                        />
                        {newQuestion.options.length > 2 && (
                          <button
                            type="button"
                            className="btn-remove-option"
                            onClick={() => removeOption(index)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {newQuestion.options.length < 6 && (
                    <button
                      type="button"
                      className="btn-add-option"
                      onClick={addOption}
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              )}

              {newQuestion.type === 'true-false' && (
                <div className="form-group">
                  <label>Correct Answer: *</label>
                  <select
                    value={newQuestion.correctAnswer}
                    onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value === 'true'})}
                    required
                  >
                    <option value="">Select correct answer</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              )}

              {(newQuestion.type === 'multiple-choice' || newQuestion.type === 'text') && (
                <div className="form-group">
                  <label>Correct Answer: *</label>
                  {newQuestion.type === 'multiple-choice' ? (
                    <select
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: parseInt(e.target.value)})}
                      required
                    >
                      <option value="">Select correct option</option>
                      {newQuestion.options.map((option, index) => (
                        <option key={index} value={index}>
                          Option {index + 1}: {option || '(empty)'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                      required
                      placeholder="Enter the correct answer"
                    />
                  )}
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary">Create Question</button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <h3>No Questions Yet</h3>
          <p>You haven't created any questions yet. Start by adding your first question!</p>
          <p>Questions you create will appear here and can be used in your quizzes.</p>
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create Your First Question
          </button>
        </div>
      ) : (
        <div className="questions-list">
          {questions.map(question => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <h3>{question.question}</h3>
                <span className={`difficulty ${question.difficulty}`}>
                  {question.difficulty}
                </span>
              </div>
              <div className="question-details">
                <p><strong>Type:</strong> {question.type}</p>
                <p><strong>Category:</strong> {question.category}</p>
                <p><strong>Points:</strong> {question.points}</p>
                {question.type === 'multiple-choice' && (
                  <div>
                    <strong>Options:</strong>
                    <ul>
                      {question.options.map((option, index) => (
                        <li key={index} className={index === question.correctAnswer ? 'correct-answer' : ''}>
                          {option} {index === question.correctAnswer && '✓'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {question.type === 'true-false' && (
                  <p><strong>Correct Answer:</strong> {question.correctAnswer ? 'True' : 'False'}</p>
                )}
                {question.type === 'text' && (
                  <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>
                )}
                <p><strong>Created:</strong> {new Date(question.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="question-actions">
                <button className="btn-edit">Edit</button>
                <button 
                  className="btn-danger"
                  onClick={() => deleteQuestion(question.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsManagement;