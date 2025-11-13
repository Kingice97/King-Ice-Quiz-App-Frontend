export const QUIZ_DIFFICULTY = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
};

export const QUIZ_CATEGORIES = [
  'General Knowledge',
  'Science',
  'Mathematics',
  'History',
  'Geography',
  'Programming',
  'Sports',
  'Entertainment',
  'Technology',
  'Business',
  'Art',
  'Music',
  'Literature',
  'Movies',
  'TV Shows'
];

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  QUIZ_PROGRESS: 'quiz_progress'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me'
  },
  QUIZZES: {
    BASE: '/quizzes',
    SUBMIT: '/quizzes/:id/submit'
  },
  RESULTS: {
    BASE: '/results'
  }
};

export const QUIZ_SETTINGS = {
  MAX_QUESTIONS: 50,
  MIN_QUESTIONS: 1,
  MAX_TIME_LIMIT: 180, // minutes
  MIN_TIME_LIMIT: 1,   // minute
  MAX_OPTIONS: 6,
  MIN_OPTIONS: 2
};

export const ACHIEVEMENTS = {
  FIRST_QUIZ: 'first_quiz',
  PERFECT_SCORE: 'perfect_score',
  SPEED_RUNNER: 'speed_runner',
  QUIZ_MASTER: 'quiz_master',
  CATEGORY_EXPERT: 'category_expert'
};