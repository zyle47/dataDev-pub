// API Configuration
// export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
// export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.26:8000';
// API Configuration - dynamically uses the same host as the frontend
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If accessing via custom domain, use api subdomain (no port needed with nginx)
  if (hostname === 'mysite.local') {
    return 'http://api.mysite.local';
  }
  
  // For IP-based access (or localhost), use /api path through nginx
  return `${protocol}//${hostname}/api`;
};

export const API_BASE_URL = getApiBaseUrl();
// Canvas Configuration
export const CANVAS_CONFIG = {
  DISPLAY_WIDTH: 1200,
  DISPLAY_HEIGHT: 675,
  ANNOTATION_LINE_WIDTH: 3, // Base line width (will be scaled based on image size)
  ANNOTATION_FONT_SIZE: 24,  // Base font size (will be scaled based on image size)
  IN_PROGRESS_LINE_WIDTH: 2, // Base line width for drawing in progress
} as const;

// Annotation Configuration
export const ANNOTATION_CONFIG = {
  MIN_BOX_SIZE: 5,
  MIN_POLYGON_POINTS: 3,
  COLORS: {
    SAVED: 'rgb(147, 51, 234)', // Purple-600
    SAVED_FILL: 'rgba(147, 51, 234, 0.1)', // Purple-600 with low transparency
    SELECTED: 'rgb(236, 72, 153)', // Pink-500
    SELECTED_FILL: 'rgba(236, 72, 153, 0.15)', // Pink-500 with low transparency
    IN_PROGRESS: 'rgb(192, 132, 252)', // Purple-400 (lighter for drawing)
    IN_PROGRESS_FILL: 'rgba(192, 132, 252, 0.15)', // Purple-400 with transparency
    LABEL_BG: 'rgba(147, 51, 234, 0.95)', // Purple-600 with transparency
    LABEL_TEXT: '#ffffff',
  },
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'] as string[],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

