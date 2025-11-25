// Chat Theme Configuration
export const chatThemes = [
  {
    id: 'default',
    name: 'Default Green',
    description: 'Classic WhatsApp green theme',
    colors: {
      primary: '#075e54',
      secondary: '#128c7e',
      sentBubble: '#dcf8c6',
      receivedBubble: '#ffffff',
      background: '#e5ddd5',
      text: '#1a1a1a',
      textLight: '#666666'
    },
    dark: {
      sentBubble: '#056162',
      receivedBubble: '#2d3b44',
      background: '#0d1418',
      text: '#ffffff',
      textLight: '#a8b5c1'
    }
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    description: 'Calming blue ocean theme',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      sentBubble: '#dbeafe',
      receivedBubble: '#ffffff',
      background: '#f0f9ff',
      text: '#1e3a8a',
      textLight: '#6b7280'
    },
    dark: {
      sentBubble: '#1e40af',
      receivedBubble: '#374151',
      background: '#111827',
      text: '#ffffff',
      textLight: '#d1d5db'
    }
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    description: 'Elegant purple theme',
    colors: {
      primary: '#6b21a8',
      secondary: '#9333ea',
      sentBubble: '#f3e8ff',
      receivedBubble: '#ffffff',
      background: '#faf5ff',
      text: '#581c87',
      textLight: '#7e22ce'
    },
    dark: {
      sentBubble: '#7c3aed',
      receivedBubble: '#3f3f46',
      background: '#1f1f23',
      text: '#ffffff',
      textLight: '#d8b4fe'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm sunset colors',
    colors: {
      primary: '#ea580c',
      secondary: '#f97316',
      sentBubble: '#ffedd5',
      receivedBubble: '#ffffff',
      background: '#fff7ed',
      text: '#9a3412',
      textLight: '#fb923c'
    },
    dark: {
      sentBubble: '#ea580c',
      receivedBubble: '#451a03',
      background: '#1c1917',
      text: '#ffffff',
      textLight: '#fdba74'
    }
  },
  {
    id: 'dark',
    name: 'Midnight Dark',
    description: 'Pure dark mode',
    colors: {
      primary: '#000000',
      secondary: '#374151',
      sentBubble: '#1f2937',
      receivedBubble: '#374151', 
      background: '#111827',
      text: '#f8fafc', // Changed from #ffffff to #f8fafc for better contrast
      textLight: '#e2e8f0' // Changed from #d1d5db to #e2e8f0 for better visibility
    }
  },
  {
    id: 'professional',
    name: 'Professional Gray',
    description: 'Clean and professional look',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      sentBubble: '#f3f4f6',
      receivedBubble: '#ffffff',
      background: '#f9fafb',
      text: '#111827',
      textLight: '#6b7280'
    },
    dark: {
      sentBubble: '#374151',
      receivedBubble: '#4b5563',
      background: '#1f2937',
      text: '#f9fafb',
      textLight: '#d1d5db'
    }
  }
];

// Get theme by ID
export const getThemeById = (themeId) => {
  return chatThemes.find(theme => theme.id === themeId) || chatThemes[0];
};

// Apply theme to chat room
export const applyChatTheme = (themeId, isDarkMode = false) => {
  const theme = getThemeById(themeId);
  const colors = isDarkMode ? theme.dark || theme.colors : theme.colors;
  
  const root = document.documentElement;
  
  console.log(`🎨 Applying theme: ${themeId} (${isDarkMode ? 'dark' : 'light'})`, colors);
  
  // Set CSS variables for the theme
  root.style.setProperty('--chat-primary', colors.primary);
  root.style.setProperty('--chat-secondary', colors.secondary);
  root.style.setProperty('--chat-sent-bubble', colors.sentBubble);
  root.style.setProperty('--chat-received-bubble', colors.receivedBubble);
  root.style.setProperty('--chat-background', colors.background);
  root.style.setProperty('--chat-text', colors.text);
  root.style.setProperty('--chat-text-light', colors.textLight);
  
  // Also apply to body for better coverage
  document.body.style.setProperty('--chat-primary', colors.primary);
  document.body.style.setProperty('--chat-secondary', colors.secondary);
  document.body.style.setProperty('--chat-sent-bubble', colors.sentBubble);
  document.body.style.setProperty('--chat-received-bubble', colors.receivedBubble);
  document.body.style.setProperty('--chat-background', colors.background);
  document.body.style.setProperty('--chat-text', colors.text);
  document.body.style.setProperty('--chat-text-light', colors.textLight);
};