import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initSecurity } from './utils/security';
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from './context/QuizContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
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

// Chat Pages
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
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Initialize security features
    initSecurity();

    // ========== PWA INSTALLATION HANDLING ==========
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Store the event so we can trigger it later
      setDeferredPrompt(e);
      // Show our custom install button
      setShowInstallPrompt(true);
      
      console.log('📱 PWA: Install prompt available');
    };

    const handleAppInstalled = () => {
      console.log('🎉 PWA: App was successfully installed');
      // Hide install prompt after successful installation
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // ========== OFFLINE DETECTION ==========
    const handleOnline = () => {
      console.log('🌐 App: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📴 App: Offline');
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-show install prompt after 8 seconds if not shown yet
    const installTimer = setTimeout(() => {
      if (deferredPrompt && !showInstallPrompt) {
        setShowInstallPrompt(true);
      }
    }, 8000);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(installTimer);
    };
  }, [deferredPrompt, showInstallPrompt]);

  // ========== INSTALL PROMPT HANDLER ==========
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('❌ No install prompt available');
      return;
    }

    try {
      // Show the native install prompt
      deferredPrompt.prompt();
      
      // Wait for user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`📱 User response to install prompt: ${outcome}`);
      
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
      
      // Hide our custom prompt regardless of outcome
      setShowInstallPrompt(false);
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
      } else {
        console.log('❌ User dismissed the install prompt');
      }
    } catch (error) {
      console.error('❌ Error showing install prompt:', error);
    }
  };

  // ========== CUSTOM INSTALL PROMPT COMPONENT ==========
  const InstallPrompt = () => (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-icon">📱</div>
        <div className="install-text">
          <h4>Install King Ice Quiz</h4>
          <p>Get the full app experience on your home screen!</p>
        </div>
        <div className="install-buttons">
          <button 
            onClick={handleInstallClick}
            className="install-btn primary"
          >
            Install App
          </button>
          <button 
            onClick={() => setShowInstallPrompt(false)}
            className="install-btn secondary"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );

  // ========== OFFLINE INDICATOR COMPONENT ==========
  const OfflineIndicator = () => (
    <div className="offline-indicator">
      <span>📶 You are currently offline</span>
    </div>
  );

  return (
    <ThemeProvider>
      <AuthProvider>
        <QuizProvider>
          <SocketProvider>
            <Router>
              <div className="App">
                {/* Offline Indicator */}
                {!isOnline && <OfflineIndicator />}
                
                {/* PWA Install Prompt */}
                {showInstallPrompt && <InstallPrompt />}
                
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
                    
                    {/* Chat Routes */}
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