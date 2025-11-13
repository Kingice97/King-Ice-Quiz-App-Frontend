import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from './context/QuizContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext'; // NEW: Chat context
import Navbar from './components/common/Navbar/Navbar';
import Footer from './components/common/Footer/Footer';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import QuizList from './pages/QuizList/QuizList';
import Quiz from './pages/Quiz/Quiz';
import Result from './pages/Result/Result';
import Profile from './pages/Profile/Profile';
import Admin from './pages/Admin/Admin';
import Dashboard from './pages/Dashboard/Dashboard';
import QuizResults from './pages/QuizResults/QuizResults';
import NotFound from './pages/NotFound/NotFound';

// NEW: Chat Pages
import Chat from './pages/Chat/Chat';
import UserSearch from './pages/UserSearch/UserSearch';

// Admin Pages
import QuizzesManagement from './pages/Admin/QuizzesManagement';
import QuestionsManagement from './pages/Admin/QuestionsManagement';
import UsersManagement from './pages/Admin/UsersManagement';
import Analytics from './pages/Admin/Analytics';
import ResultsManagement from './pages/Admin/ResultsManagement';
import LeaderboardPage from './pages/Admin/LeaderboardPage';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QuizProvider>
          <SocketProvider> {/* NEW: Wrap with Socket Provider */}
            <Router>
              <div className="App">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/quizzes" element={<QuizList />} />
                    
                    {/* Protected routes - regular users */}
                    <Route 
                      path="/quiz/:id" 
                      element={
                        <ProtectedRoute>
                          <Quiz />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/result" 
                      element={
                        <ProtectedRoute>
                          <Result />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* NEW: Chat Routes */}
                    <Route 
                      path="/chat" 
                      element={
                        <ProtectedRoute>
                          <Chat />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/users" 
                      element={
                        <ProtectedRoute>
                          <UserSearch />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Admin Routes - protected and admin only */}
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <Admin />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/quizzes" 
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <QuizzesManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/questions" 
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <QuestionsManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/users" 
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <UsersManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/analytics" 
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <Analytics />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/results" 
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <ResultsManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/leaderboard" 
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <LeaderboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/quiz/:id/results" 
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <QuizResults />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* 404 page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </SocketProvider>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;