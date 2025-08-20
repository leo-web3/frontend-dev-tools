// Storage Keys
export const STORAGE_KEYS = {
  ENVIRONMENTS: 'environments',
  CORS_SETTINGS: 'corsSettings',
  UI_COMPARISONS: 'uiComparisons',
  GLOBAL_SETTINGS: 'globalSettings',
  LAST_ACTIVE_TAB: 'lastActiveTab',
} as const;

// Default Values
export const DEFAULT_CORS_CONFIG = {
  enabled: false,
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
};

export const DEFAULT_ENVIRONMENT_CONFIG = {
  variables: [],
  globalEnabled: false,
  autoInject: true,
};

export const DEFAULT_GLOBAL_SETTINGS = {
  theme: 'light' as const,
  language: 'zh' as const,
  lastActiveTab: 'environment' as const,
  shortcuts: {
    toggleCors: 'Ctrl+Shift+C',
    toggleEnvironment: 'Ctrl+Shift+E',
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
  CORS_ERROR: 'CORS_ERROR',
  ENVIRONMENT_ERROR: 'ENVIRONMENT_ERROR',
  UI_OVERLAY_ERROR: 'UI_OVERLAY_ERROR',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  INJECT_ENVIRONMENT: 'INJECT_ENVIRONMENT',
  CREATE_OVERLAY: 'CREATE_OVERLAY',
  UPDATE_OVERLAY: 'UPDATE_OVERLAY',
  REMOVE_OVERLAY: 'REMOVE_OVERLAY',
  TOGGLE_OVERLAY_VISIBILITY: 'TOGGLE_OVERLAY_VISIBILITY',
  CORS_STATUS_CHANGED: 'CORS_STATUS_CHANGED',
  GET_CURRENT_TAB: 'GET_CURRENT_TAB',
  ADJUST_BROWSER_SIZE: 'ADJUST_BROWSER_SIZE',
  SAVE_CONFIG: 'SAVE_CONFIG',
  LOAD_CONFIG: 'LOAD_CONFIG',
} as const;

// Environment Variable Patterns
export const ENV_PATTERNS = {
  COMMENT: /^\s*#.*$/,
  EMPTY_LINE: /^\s*$/,
  VARIABLE: /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/,
  QUOTED_VALUE: /^(['"])(.*)\1$/,
} as const;

// CORS Headers
export const CORS_HEADERS = {
  ACCESS_CONTROL_ALLOW_ORIGIN: 'Access-Control-Allow-Origin',
  ACCESS_CONTROL_ALLOW_METHODS: 'Access-Control-Allow-Methods',
  ACCESS_CONTROL_ALLOW_HEADERS: 'Access-Control-Allow-Headers',
  ACCESS_CONTROL_ALLOW_CREDENTIALS: 'Access-Control-Allow-Credentials',
  ACCESS_CONTROL_MAX_AGE: 'Access-Control-Max-Age',
} as const;