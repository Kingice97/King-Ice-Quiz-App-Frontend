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
import ServerStatus from './components/common/ServerStatus/ServerStatus';

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

    // ✅ NEW: Enhanced Service Worker Registration for Push Notifications
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Service Worker registered successfully:', registration);
          
          // Check if service worker is controlling the page
          if (navigator.serviceWorker.controller) {
            console.log('🎯 Service Worker is controlling the page');
          }

          // ✅ NEW: Wait for service worker to be ready before using it
          await navigator.serviceWorker.ready;
          console.log('🟢 Service Worker ready for push notifications');

        } catch (error) {
          console.log('❌ Service Worker registration failed:', error);
          // This is safe - app continues working without service worker
        }
      } else {
        console.log('❌ Service Workers are not supported in this browser');
      }
    };

    registerServiceWorker();

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
      
      // ✅ NEW: Track installation for analytics
      localStorage.setItem('appInstalled', 'true');
    };

    // ========== OFFLINE DETECTION ==========
    const handleOnline = () => {
      console.log('🌐 App: Online');
      setIsOnline(true);
      
      // ✅ NEW: Refresh data when coming back online
      if (localStorage.getItem('token')) {
        console.log('🔄 Online again - data may need refresh');
      }
    };

    const handleOffline = () => {
      console.log('📴 App: Offline');
      setIsOnline(false);
      
      // ✅ NEW: Show offline notification
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('You are offline', {
            body: 'Some features may not work until connection is restored',
            icon: '/brain-icon.png',
            badge: '/brain-icon.png',
            tag: 'offline-notification'
          });
        });
      }
    };

    // ========== VISIBILITY CHANGE HANDLING ==========
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 App became visible - checking connection status');
        // App came to foreground, might want to refresh data
      }
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Auto-show install prompt after 10 seconds if not shown yet
    const installTimer = setTimeout(() => {
      if (deferredPrompt && !showInstallPrompt) {
        setShowInstallPrompt(true);
      }
    }, 10000);

    // ✅ NEW: Periodic health check for Render.com
    const healthCheckInterval = setInterval(() => {
      if (localStorage.getItem('token')) {
        // This will keep Render.com awake by making occasional requests
        console.log('🏥 Periodic health check');
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    // Cleanup function
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(installTimer);
      clearInterval(healthCheckInterval);
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
        
        // ✅ NEW: Track successful installation
        localStorage.setItem('pwaInstalled', 'true');
      } else {
        console.log('❌ User dismissed the install prompt');
      }
    } catch (error) {
      console.error('❌ Error showing install prompt:', error);
    }
  };

  // ========== INSTALL PROMPT COMPONENT ==========
  const InstallPrompt = () => (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '15px',
      padding: '20px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      zIndex: 10000,
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      animation: 'slideInUp 0.5s ease-out'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '15px'
      }}>
        <div style={{
          fontSize: '28px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          📱
        </div>
        <div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Install King Ice Quiz
          </h4>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            Get the full app experience with offline quizzes and push notifications!
          </p>
        </div>
      </div>
      <div style={{
        display: 'flex',
        gap: '10px'
      }}>
        <button 
          onClick={handleInstallClick}
          style={{
            background: 'white',
            color: '#667eea',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            flex: 1,
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Install App
        </button>
        <button 
          onClick={() => setShowInstallPrompt(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            flex: 1,
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          Later
        </button>
      </div>
    </div>
  );

  // ========== OFFLINE INDICATOR COMPONENT ==========
  const OfflineIndicator = () => (
    <div className="offline-indicator">
      <span>📶 You are currently offline - some features may be limited</span>
    </div>
  );

  return (
    <ThemeProvider>
      <AuthProvider>
        <QuizProvider>
          <SocketProvider>
            <Router>
              <div className="App">
                {/* Server Status Indicator */}
                <ServerStatus />
                
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