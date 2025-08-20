import { EnvironmentVariable, ExtensionError } from './types';
import { ENV_PATTERNS, ERROR_CODES, UI_CONSTANTS } from './constants';

// Environment Variable Utilities
export function parseEnvFile(content: string): EnvironmentVariable[] {
  const variables: EnvironmentVariable[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comments and empty lines
    if (ENV_PATTERNS.COMMENT.test(line) || ENV_PATTERNS.EMPTY_LINE.test(line)) {
      return;
    }

    const match = line.match(ENV_PATTERNS.VARIABLE);
    if (match) {
      const [, key, rawValue] = match;
      const value = unquoteValue(rawValue);
      
      variables.push({
        key: key.trim(),
        value: value.trim(),
        enabled: true,
      });
    } else if (line.trim()) {
      console.warn(`Invalid environment variable format at line ${index + 1}: ${line}`);
    }
  });

  return variables;
}

function unquoteValue(value: string): string {
  const quotedMatch = value.match(ENV_PATTERNS.QUOTED_VALUE);
  return quotedMatch ? quotedMatch[2] : value;
}

export function validateEnvironmentVariable(variable: EnvironmentVariable): string[] {
  const errors: string[] = [];

  if (!variable.key || !variable.key.trim()) {
    errors.push('Variable key is required');
  }

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(variable.key)) {
    errors.push('Variable key must start with a letter or underscore and contain only letters, numbers, and underscores');
  }

  return errors;
}

// URL and Domain Utilities
export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getCurrentTabDomain(): Promise<string> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        resolve(getDomainFromUrl(tab.url));
      } else {
        resolve('');
      }
    });
  });
}

// File Utilities
export function validateImageFile(file: File): string[] {
  const errors: string[] = [];

  if (!file) {
    errors.push('No file provided');
    return errors;
  }

  // Check file size
  if (file.size > UI_CONSTANTS.MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum limit of ${formatFileSize(UI_CONSTANTS.MAX_FILE_SIZE)}`);
  }

  // Check file type
  const extension = file.name.toLowerCase().split('.').pop();
  if (!extension || !UI_CONSTANTS.SUPPORTED_IMAGE_FORMATS.includes(extension)) {
    errors.push(`Unsupported file format. Supported formats: ${UI_CONSTANTS.SUPPORTED_IMAGE_FORMATS.join(', ')}`);
  }

  return errors;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Error Handling Utilities
export function createExtensionError(
  message: string,
  code: keyof typeof ERROR_CODES,
  context?: string
): ExtensionError {
  const error = new Error(message) as ExtensionError;
  error.code = ERROR_CODES[code];
  error.context = context;
  return error;
}

export function isExtensionError(error: any): error is ExtensionError {
  return error && typeof error === 'object' && 'code' in error;
}

// Debounce Utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Deep Clone Utility
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

// Generate Unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Format Date
export function formatDate(date: Date): string {
  return date.toLocaleString();
}

// Validate CORS Origin
export function validateCorsOrigin(origin: string): boolean {
  if (origin === '*') return true;
  
  try {
    new URL(origin);
    return true;
  } catch {
    return false;
  }
}