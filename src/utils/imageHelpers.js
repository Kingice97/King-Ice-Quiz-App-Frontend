// src/utils/imageHelpers.js
export const getProfilePictureUrl = (pictureUrl) => {
  if (!pictureUrl) return '/default-avatar.png';
  
  // If it's already a full URL (Cloudinary), use it directly
  if (pictureUrl.startsWith('http')) {
    return pictureUrl;
  }
  
  // If it's a local path, prepend server URL (for backward compatibility)
  if (pictureUrl.startsWith('/uploads')) {
    const baseUrl = process.env.REACT_APP_API_URL || 'https://king-ice-quiz.onrender.com';
    return `${baseUrl}${pictureUrl}`;
  }
  
  return '/default-avatar.png';
};

export const getMessageProfilePicture = (profilePicture) => {
  return getProfilePictureUrl(profilePicture);
};