// // Detect and deter console access
// export const initSecurity = () => {
//   // Disable right-click context menu
//   document.addEventListener('contextmenu', (e) => {
//     e.preventDefault();
//     return false;
//   });

//   // Disable specific keys
//   document.addEventListener('keydown', (e) => {
//     // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
//     if (
//       e.key === 'F12' ||
//       (e.ctrlKey && e.shiftKey && e.key === 'I') ||
//       (e.ctrlKey && e.shiftKey && e.key === 'J') ||
//       (e.ctrlKey && e.key === 'u')
//     ) {
//       e.preventDefault();
//       return false;
//     }
//   });

//   // Detect console opening (not 100% reliable)
//   let consoleOpen = false;
//   const threshold = 160; // Height difference when console opens
  
//   setInterval(() => {
//     if (window.outerHeight - window.innerHeight > threshold) {
//       if (!consoleOpen) {
//         consoleOpen = true;
//         // Redirect or show warning
//         window.location.reload();
//       }
//     } else {
//       consoleOpen = false;
//     }
//   }, 1000);
// };

// // Obfuscate sensitive data
// export const obfuscateData = (data) => {
//   // This doesn't prevent determined users but adds a layer
//   return btoa(JSON.stringify(data)); // Base64 encode
// };








//the above is not for people to use F12 or inspect my website, the below is temporary till i fixed things//









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