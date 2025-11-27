import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import { QUIZ_CATEGORIES, QUIZ_DIFFICULTY } from '../../utils/constants';
import QuizCard from '../../components/quiz/QuizCard/QuizCard';
import Loading from '../../components/common/Loading/Loading';
import './QuizList.css';

const QuizList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    difficulty: searchParams.get('difficulty') || '',
    search: searchParams.get('search') || ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data: quizzesData, loading, error, setData } = useApi(() =>
    quizService.getQuizzes({
      ...filters,
      sortBy,
      sortOrder,
      page: 1,
      limit: 50
    })
  );

  const quizzes = quizzesData?.data || [];
  const pagination = quizzesData?.pagination;

  useEffect(() => {
    // Update URL with current filters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const search = formData.get('search');
    handleFilterChange('search', search);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      difficulty: '',
      search: ''
    });
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className="quiz-list-page">
      <Helmet>
        <title>Quizzes - King Ice Quiz</title>
        <meta name="description" content="Browse all available quizzes on King Ice Quiz" />
      </Helmet>

      <div className="container">
        <div className="page-header">
          <h1>Available Quizzes</h1>
          <p>Test your knowledge with our curated collection of quizzes</p>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <form onSubmit={handleSearch} className="search-box">
            <input
              type="text"
              name="search"
              placeholder="Search quizzes by title, description, or category..."
              defaultValue={filters.search}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="category" className="filter-label">Category</label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {QUIZ_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="difficulty" className="filter-label">Difficulty</label>
              <select
                id="difficulty"
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="filter-select"
              >
                <option value="">All Levels</option>
                {Object.values(QUIZ_DIFFICULTY).map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sort" className="filter-label">Sort By</label>
              <select
                id="sort"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="filter-select"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="difficulty-asc">Easiest First</option>
                <option value="difficulty-desc">Hardest First</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-outline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && <Loading text="Loading quizzes..." />}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <div className="alert alert-error">
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Quizzes Grid */}
        {!loading && !error && (
          <>
            <div className="quizzes-header">
              <h2>
                {quizzes.length} Quiz{quizzes.length !== 1 ? 'zes' : ''} Found
                {filters.search && ` for "${filters.search}"`}
                {filters.category && ` in ${filters.category}`}
                {filters.difficulty && ` (${filters.difficulty})`}
              </h2>
            </div>

            {quizzes.length > 0 ? (
              <div className="quizzes-grid">
                {quizzes.map(quiz => (
                  <QuizCard key={quiz._id} quiz={quiz} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No quizzes found</h3>
                <p>Try adjusting your search criteria or browse all categories.</p>
                <button
                  onClick={clearFilters}
                  className="btn btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuizList;