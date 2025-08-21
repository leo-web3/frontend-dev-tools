// Storage Keys
export const STORAGE_KEYS = {
  UI_COMPARISONS: 'uiComparisons',
  GLOBAL_SETTINGS: 'globalSettings',
  LAST_ACTIVE_TAB: 'lastActiveTab',
} as const;


export const DEFAULT_GLOBAL_SETTINGS = {
  theme: 'light' as const,
  language: 'zh' as const,
  lastActiveTab: 'ui-comparator' as const,
  shortcuts: {
    toggleUIComparator: 'Ctrl+Shift+U',
  },
};

// UI Constants
export const UI_CONSTANTS = {
  OVERLAY_MIN_SIZE: { width: 50, height: 50 },
  OVERLAY_MAX_SIZE: { width: 2000, height: 2000 },
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_FORMATS: ['png', 'jpg', 'jpeg', 'svg', 'gif'],
  COMMON_SCREEN_SIZES: [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Large Desktop', width: 1920, height: 1080 },
  ],
};

// Error Codes
export const ERROR_CODES = {
  STORAGE_ERROR: 'STORAGE_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UI_OVERLAY_ERROR: 'UI_OVERLAY_ERROR',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  CREATE_OVERLAY: 'CREATE_OVERLAY',
  UPDATE_OVERLAY: 'UPDATE_OVERLAY',
  REMOVE_OVERLAY: 'REMOVE_OVERLAY',
  TOGGLE_OVERLAY_VISIBILITY: 'TOGGLE_OVERLAY_VISIBILITY',
  GET_CURRENT_TAB: 'GET_CURRENT_TAB',
  ADJUST_BROWSER_SIZE: 'ADJUST_BROWSER_SIZE',
  SAVE_CONFIG: 'SAVE_CONFIG',
  LOAD_CONFIG: 'LOAD_CONFIG',
  PING: 'PING',
  GET_VIEWPORT_DIMENSIONS: 'GET_VIEWPORT_DIMENSIONS',
} as const;

