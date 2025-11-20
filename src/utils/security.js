// Security features - COMPLETELY DISABLED FOR DEVELOPMENT
export const initSecurity = () => {
  console.log('🔓 SECURITY COMPLETELY DISABLED - Press F12 freely!');
  return; // No security at all for now
};

// Obfuscate sensitive data
export const obfuscateData = (data) => {
  return btoa(JSON.stringify(data));
};