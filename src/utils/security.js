// Security features - Development friendly version
export const initSecurity = () => {
  // Only enable security in production
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    console.log('🔓 Development mode: Security features disabled for debugging');
    return; // Skip all security in development
  }

  console.log('🛡️ Production mode: Security features enabled');
  
  // Disable right-click context menu (PRODUCTION ONLY)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable specific keys (PRODUCTION ONLY)
  document.addEventListener('keydown', (e) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.key === 'u')
    ) {
      e.preventDefault();
      return false;
    }
  });

  // Detect console opening (PRODUCTION ONLY)
  let consoleOpen = false;
  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold) {
      if (!consoleOpen) {
        consoleOpen = true;
        window.location.reload();
      }
    } else {
      consoleOpen = false;
    }
  }, 1000);
};

// Obfuscate sensitive data
export const obfuscateData = (data) => {
  return btoa(JSON.stringify(data));
};