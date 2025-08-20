// Environment Variables Types
export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
  domain?: string;
}

export interface EnvironmentConfig {
  variables: EnvironmentVariable[];
  globalEnabled: boolean;
  autoInject: boolean;
}

// CORS Types
export interface CorsConfig {
  enabled: boolean;
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

// UI Comparator Types
export interface UIOverlay {
  id: string;
  imageUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
  visible: boolean;
  locked: boolean;
}

export interface UIComparatorConfig {
  overlays: UIOverlay[];
  browserSize?: { width: number; height: number };
}

// Storage Schema
export interface ExtensionStorage {
  environments: {
    [domain: string]: EnvironmentConfig;
  };
  corsSettings: CorsConfig;
  uiComparisons: {
    [url: string]: UIComparatorConfig;
  };
  globalSettings: {
    theme: 'light' | 'dark';
    language: 'zh' | 'en';
    lastActiveTab: string;
    shortcuts: { [action: string]: string };
  };
}

// Message Protocol Types
export type MessageType = 
  | 'INJECT_ENVIRONMENT'
  | 'CREATE_OVERLAY'
  | 'UPDATE_OVERLAY'
  | 'REMOVE_OVERLAY'
  | 'TOGGLE_OVERLAY_VISIBILITY'
  | 'CORS_STATUS_CHANGED'
  | 'GET_CURRENT_TAB'
  | 'ADJUST_BROWSER_SIZE'
  | 'SAVE_CONFIG'
  | 'LOAD_CONFIG';

export interface Message<T = any> {
  type: MessageType;
  payload?: T;
  tabId?: number;
}

// Response Types
export interface ExtensionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Error Types
export interface ExtensionError extends Error {
  code: string;
  context?: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type StorageKey = keyof ExtensionStorage;