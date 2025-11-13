// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password) => {
  return password.length >= 6;
};

// Username validation
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

// Quiz title validation
export const isValidQuizTitle = (title) => {
  return title.length >= 1 && title.length <= 100;
};

// Quiz description validation
export const isValidQuizDescription = (description) => {
  return description.length >= 1 && description.length <= 500;
};

// Question text validation
export const isValidQuestionText = (text) => {
  return text.length >= 1 && text.length <= 1000;
};

// Option validation
export const isValidOption = (option) => {
  return option.length >= 1 && option.length <= 200;
};

// Form validation for registration
export const validateRegistration = (formData) => {
  const errors = {};

  if (!formData.username) {
    errors.username = 'Username is required';
  } else if (!isValidUsername(formData.username)) {
    errors.username = 'Username must be 3-30 characters and can only contain letters, numbers, and underscores';
  }

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (!isValidPassword(formData.password)) {
    errors.password = 'Password must be at least 6 characters long';
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

// Form validation for login
export const validateLogin = (formData) => {
  const errors = {};

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  }

  return errors;
};

// Form validation for quiz creation
export const validateQuiz = (quizData) => {
  const errors = {};

  if (!quizData.title) {
    errors.title = 'Quiz title is required';
  } else if (!isValidQuizTitle(quizData.title)) {
    errors.title = 'Quiz title must be between 1 and 100 characters';
  }

  if (!quizData.description) {
    errors.description = 'Quiz description is required';
  } else if (!isValidQuizDescription(quizData.description)) {
    errors.description = 'Quiz description must be between 1 and 500 characters';
  }

  if (!quizData.category) {
    errors.category = 'Category is required';
  }

  if (!quizData.questions || quizData.questions.length === 0) {
    errors.questions = 'Quiz must have at least one question';
  } else {
    quizData.questions.forEach((question, index) => {
      if (!question.questionText) {
        errors[`questions[${index}].questionText`] = 'Question text is required';
      } else if (!isValidQuestionText(question.questionText)) {
        errors[`questions[${index}].questionText`] = 'Question text must be between 1 and 1000 characters';
      }

      if (!question.options || question.options.length < 2) {
        errors[`questions[${index}].options`] = 'Question must have at least 2 options';
      } else {
        question.options.forEach((option, optIndex) => {
          if (!option) {
            errors[`questions[${index}].options[${optIndex}]`] = 'Option cannot be empty';
          } else if (!isValidOption(option)) {
            errors[`questions[${index}].options[${optIndex}]`] = 'Option must be between 1 and 200 characters';
          }
        });
      }

      if (question.correctAnswer === undefined || question.correctAnswer === null) {
        errors[`questions[${index}].correctAnswer`] = 'Please select a correct answer';
      }
    });
  }

  return errors;
};