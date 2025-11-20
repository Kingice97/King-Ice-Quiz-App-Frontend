import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { isServerReachable } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline

  // DEBUG: Log when AuthContext loads
  console.log('🔄 DEBUG: AuthContext.js LOADED - version 1.0.5 - OPTIMIZED FOR RENDER.COM');

  useEffect(() => {
    checkServerStatus();
    checkAuth();
  }, []);

  // ✅ NEW: Check server status first
  const checkServerStatus = async () => {
    try {
      console.log('🌐 Checking server status...');
      const isReachable = await isServerReachable();
      setServerStatus(isReachable ? 'online' : 'offline');
      console.log(`🌐 Server status: ${isReachable ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
    } catch (error) {
      console.error('❌ Server status check failed:', error);
      setServerStatus('offline');
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');
      
      console.log('🔐 Auth Check Debug:', { 
        tokenExists: !!token, 
        userDataExists: !!userData,
        serverStatus: serverStatus
      });
      
      // ✅ FIXED: Only clear data if both token AND userData are missing
      if (!token && !userData) {
        console.log('🚫 No auth data found - user not logged in');
        setUser(null);
        setLoading(false);
        return;
      }
      
      // ✅ FIXED: If we have userData but no token, use cached data
      if (userData && !token) {
        console.log('⚠️ User data exists but no token - using cached data');
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setLoading(false);
          return;
        } catch (parseError) {
          console.error('Error parsing cached user data:', parseError);
          clearAuthData();
          setLoading(false);
          return;
        }
      }
      
      // ✅ FIXED: If server is offline, use cached data immediately
      if (serverStatus === 'offline' && userData) {
        console.log('🌐 Server offline - using cached user data');
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setLoading(false);
          return;
        } catch (parseError) {
          console.error('Error parsing cached user data:', parseError);
          clearAuthData();
          setLoading(false);
          return;
        }
      }
      
      // ✅ FIXED: If we have token, try to verify but don't clear on failure
      if (token) {
        try {
          // Set user immediately from localStorage for better UX
          if (userData) {
            const parsedUser = JSON.parse(userData);
            console.log('📋 Setting user from localStorage:', parsedUser.username);
            setUser(parsedUser);
          }
          
          console.log('🔄 Verifying token with backend...');
          const freshUserData = await authService.getMe();
          console.log('✅ Token valid, fresh user data received');
          
          // Update with fresh data and store it
          const userWithOnlineStatus = {
            ...freshUserData,
            isOnline: true
          };
          
          setUser(userWithOnlineStatus);
          localStorage.setItem('userData', JSON.stringify(userWithOnlineStatus));
          setServerStatus('online');
          console.log('🎉 Auth successful with fresh data');
          
        } catch (authError) {
          console.error('❌ Token verification failed:', authError.message);
          
          // ✅ FIXED: Don't clear data immediately - use cached data as fallback
          if (userData) {
            console.log('🔄 Using cached user data due to API error');
            try {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
              setServerStatus('offline'); // Mark server as offline
              console.log('✅ Using cached user data:', parsedUser.username);
            } catch (parseError) {
              console.error('Error parsing cached user data:', parseError);
              clearAuthData();
            }
          } else {
            console.log('🔄 No cached user data available, clearing auth');
            clearAuthData();
          }
        }
      }
    } catch (error) {
      console.error('💥 Auth check failed:', error);
      // Don't clear data on unexpected errors
      console.log('🔄 Keeping existing auth data due to unexpected error');
    } finally {
      setLoading(false);
      console.log('🏁 Auth check completed, loading:', false, 'user:', user ? user.username : 'none');
    }
  };

  const clearAuthData = () => {
    console.log('🧹 Clearing auth data');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
    setServerStatus('checking');
  };

  const login = async (credentials) => {
    try {
      setError('');
      setLoading(true);
      console.log('🔐 DEBUG: Login function called with:', { email: credentials.email });
      
      // DEBUG: Log what authService.login actually is
      console.log('🔐 DEBUG: authService.login function:', authService.login);
      console.log('🔐 DEBUG: authService object:', authService);
      
      // DEBUG: Test if the function exists and is callable
      if (typeof authService.login !== 'function') {
        throw new Error('authService.login is not a function!');
      }
      
      console.log('🔐 DEBUG: Calling authService.login...');
      const response = await authService.login(credentials);
      console.log('🔐 DEBUG: authService.login response:', response);
      
      const { token, user } = response;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      if (!user) {
        throw new Error('No user data received from server');
      }
      
      // NEW: Set user as online
      const userWithOnlineStatus = {
        ...user,
        isOnline: true
      };
      
      // Store both token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userWithOnlineStatus));
      setUser(userWithOnlineStatus);
      setServerStatus('online');
      
      console.log('🎉 Login successful! User:', user.username);
      return response;
    } catch (error) {
      console.error('💥 Login error:', error);
      console.error('💥 Login error details:', {
        message: error.message,
        response: error.response,
        config: error.config
      });
      
      // Extract error message
      let message = 'Login failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      
      // Special handling for timeout errors
      if (error.code === 'ECONNABORTED') {
        message = 'Server is taking too long to respond. This is normal on free hosting. Please wait and try again.';
      }
      
      setError(message);
      clearAuthData();
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);
      console.log('📝 DEBUG: Register function called with:', { username: userData.username, email: userData.email });
      
      // DEBUG: Log what authService.register actually is
      console.log('📝 DEBUG: authService.register function:', authService.register);
      
      // DEBUG: Test if the function exists and is callable
      if (typeof authService.register !== 'function') {
        throw new Error('authService.register is not a function!');
      }
      
      console.log('📝 DEBUG: Calling authService.register...');
      const response = await authService.register(userData);
      console.log('📝 DEBUG: authService.register response:', response);
      
      const { token, user } = response;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      // NEW: Set user as online
      const userWithOnlineStatus = {
        ...user,
        isOnline: true
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userWithOnlineStatus));
      setUser(userWithOnlineStatus);
      setServerStatus('online');
      
      console.log('🎉 Registration successful! User:', user.username);
      return response;
    } catch (error) {
      console.error('💥 Registration error:', error);
      console.error('💥 Registration error details:', {
        message: error.message,
        response: error.response,
        config: error.config
      });
      
      let message = error.response?.data?.message || error.message || 'Registration failed';
      
      // Special handling for timeout errors
      if (error.code === 'ECONNABORTED') {
        message = 'Server is taking too long to respond. This is normal on free hosting. Please wait and try again.';
      }
      
      setError(message);
      clearAuthData();
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('👋 Logging out user:', user?.username);
    
    try {
      // Only call logout endpoint if server is online
      if (serverStatus === 'online') {
        await authService.logout();
      } else {
        console.log('🌐 Server offline - skipping logout API call');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthData();
      setError('');
    }
  };

  const updateUser = async (userData) => {
    try {
      setError('');
      console.log('📋 Updating user profile');
      
      const response = await userService.updateProfile(userData);
      
      // Update local state and localStorage
      const updatedUser = { ...user, ...response.user };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      console.log('✅ Profile update successful');
      return response;
    } catch (error) {
      console.error('💥 Profile update error:', error);
      const message = error.response?.data?.message || 'Profile update failed';
      setError(message);
      throw error;
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      setError('');
      console.log('🔑 Updating password');
      
      const response = await userService.changePassword(passwordData);
      console.log('✅ Password update successful');
      return response;
    } catch (error) {
      console.error('💥 Password update error:', error);
      const message = error.response?.data?.message || 'Password change failed';
      setError(message);
      throw error;
    }
  };

  // FIXED: Update profile picture with proper field handling
  const updateProfilePicture = async (imageFile) => {
    try {
      setError('');
      console.log('🖼️ Updating profile picture');
      
      const formData = new FormData();
      formData.append('profilePicture', imageFile);
      
      const response = await userService.uploadProfilePicture(formData);
      
      // FIXED: Update local state with correct profile picture field
      const updatedUser = { 
        ...user, 
        profile: {
          ...user.profile,
          picture: response.profilePicture
        }
      };
      
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      console.log('✅ Profile picture updated successfully:', response.profilePicture);
      return response;
    } catch (error) {
      console.error('💥 Profile picture update error:', error);
      const message = error.response?.data?.message || 'Profile picture update failed';
      setError(message);
      
      // ✅ FIXED: Don't clear auth data on upload failure
      // Just throw the error and let the component handle it
      throw error;
    }
  };

  // NEW: Update chat preferences
  const updateChatPreferences = async (preferences) => {
    try {
      setError('');
      console.log('⚙️ Updating chat preferences');
      
      const response = await userService.updateChatPreferences(preferences);
      
      // Update local state
      const updatedUser = { 
        ...user, 
        preferences: { ...user.preferences, ...response.preferences } 
      };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      console.log('✅ Chat preferences updated successfully');
      return response;
    } catch (error) {
      console.error('💥 Chat preferences update error:', error);
      const message = error.response?.data?.message || 'Chat preferences update failed';
      setError(message);
      throw error;
    }
  };

  const clearError = () => {
    setError('');
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data...');
      const userData = await authService.getMe();
      
      // NEW: Maintain online status
      const userWithOnlineStatus = {
        ...userData,
        isOnline: user?.isOnline || true
      };
      
      setUser(userWithOnlineStatus);
      localStorage.setItem('userData', JSON.stringify(userWithOnlineStatus));
      setServerStatus('online');
      console.log('✅ User data refreshed');
    } catch (error) {
      console.error('💥 Refresh user failed:', error);
      // Don't logout on refresh failure, just use cached data
      console.log('🔄 Using cached user data due to refresh failure');
      setServerStatus('offline');
    }
  };

  // ✅ NEW: Retry server connection
  const retryServerConnection = async () => {
    try {
      setLoading(true);
      console.log('🔄 Retrying server connection...');
      await checkServerStatus();
      await checkAuth();
    } finally {
      setLoading(false);
    }
  };

  // NEW: Get user safely - always returns user object even if API fails
  const getSafeUser = () => {
    if (user) return user;
    
    // Try to get from localStorage as fallback
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('🔄 Using fallback user data from localStorage');
        return parsedUser;
      }
    } catch (error) {
      console.error('Error getting fallback user data:', error);
    }
    
    return null;
  };

  const value = {
    user: getSafeUser(), // Use safe getter
    login,
    register,
    logout,
    updateUser,
    updatePassword,
    updateProfilePicture,
    updateChatPreferences,
    refreshUser,
    retryServerConnection, // ✅ NEW
    loading,
    error,
    clearError,
    serverStatus, // ✅ NEW
    isAuthenticated: !!getSafeUser(), // Use safe getter
    isAdmin: getSafeUser()?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};