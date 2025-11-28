// Security Utilities for King Ice Quiz App
import CryptoJS from 'crypto-js';

// Encryption key for your app
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'fallback-key-for-dev';

export const initSecurity = () => {
  console.log('🔒 Security features enabled for King Ice Quiz');
};

// Encrypt sensitive data
export const encryptData = (data) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

// Decrypt data
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

// Secure storage with encryption
export const secureStorage = {
  set: (key, value) => {
    try {
      const encrypted = encryptData(value);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Secure storage failed:', error);
    }
  },

  get: (key) => {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      return encrypted ? decryptData(encrypted) : null;
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  },

  remove: (key) => {
    localStorage.removeItem(`secure_${key}`);
  }
};

// Basic input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '');
};