import { ExtensionStorage, StorageKey, DeepPartial, ExtensionError } from './types';
import { 
  STORAGE_KEYS, 
  DEFAULT_GLOBAL_SETTINGS 
} from './constants';
import { createExtensionError } from './utils';

class StorageManager {
  private static instance: StorageManager;
  
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Generic get method
  async get<K extends StorageKey>(key: K): Promise<ExtensionStorage[K]> {
    try {
      // Use local storage for UI_COMPARISONS due to large image data
      const storageArea = key === 'uiComparisons' ? chrome.storage.local : chrome.storage.sync;
      const result = await storageArea.get(key);
      return result[key] || this.getDefaultValue(key);
    } catch (error) {
      console.error(`Failed to get storage key ${key}:`, error);
      throw createExtensionError(
        `Failed to retrieve ${key} from storage`,
        'STORAGE_ERROR',
        'StorageManager.get'
      );
    }
  }

  // Generic set method
  async set<K extends StorageKey>(
    key: K, 
    value: ExtensionStorage[K]
  ): Promise<void> {
    try {
      // Use local storage for UI_COMPARISONS due to large image data
      const storageArea = key === 'uiComparisons' ? chrome.storage.local : chrome.storage.sync;
      await storageArea.set({ [key]: value });
    } catch (error) {
      console.error(`Failed to set storage key ${key}:`, error);
      throw createExtensionError(
        `Failed to save ${key} to storage`,
        'STORAGE_ERROR',
        'StorageManager.set'
      );
    }
  }

  // Update method for partial updates
  async update<K extends StorageKey>(
    key: K, 
    updates: DeepPartial<ExtensionStorage[K]>
  ): Promise<void> {
    try {
      const current = await this.get(key);
      const updated = this.mergeDeep(current, updates);
      await this.set(key, updated);
    } catch (error) {
      console.error(`Failed to update storage key ${key}:`, error);
      throw createExtensionError(
        `Failed to update ${key} in storage`,
        'STORAGE_ERROR',
        'StorageManager.update'
      );
    }
  }

  // Get all storage data
  async getAll(): Promise<Partial<ExtensionStorage>> {
    try {
      const [syncData, localData] = await Promise.all([
        chrome.storage.sync.get(null),
        chrome.storage.local.get(['uiComparisons'])
      ]);
      return { ...syncData, ...localData } as Partial<ExtensionStorage>;
    } catch (error) {
      console.error('Failed to get all storage data:', error);
      throw createExtensionError(
        'Failed to retrieve all storage data',
        'STORAGE_ERROR',
        'StorageManager.getAll'
      );
    }
  }

  // Clear all storage data
  async clear(): Promise<void> {
    try {
      await Promise.all([
        chrome.storage.sync.clear(),
        chrome.storage.local.clear()
      ]);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw createExtensionError(
        'Failed to clear storage',
        'STORAGE_ERROR',
        'StorageManager.clear'
      );
    }
  }

  // Remove specific key
  async remove(key: StorageKey): Promise<void> {
    try {
      const storageArea = key === 'uiComparisons' ? chrome.storage.local : chrome.storage.sync;
      await storageArea.remove(key);
    } catch (error) {
      console.error(`Failed to remove storage key ${key}:`, error);
      throw createExtensionError(
        `Failed to remove ${key} from storage`,
        'STORAGE_ERROR',
        'StorageManager.remove'
      );
    }
  }

  // Get storage usage
  async getUsage(): Promise<{ bytesInUse: number; quotaBytes: number }> {
    try {
      const [syncBytes, localBytes] = await Promise.all([
        chrome.storage.sync.getBytesInUse(),
        chrome.storage.local.getBytesInUse()
      ]);
      return {
        bytesInUse: syncBytes + localBytes,
        quotaBytes: chrome.storage.sync.QUOTA_BYTES + chrome.storage.local.QUOTA_BYTES,
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      throw createExtensionError(
        'Failed to get storage usage',
        'STORAGE_ERROR',
        'StorageManager.getUsage'
      );
    }
  }

  // Export all data
  async exportData(): Promise<string> {
    try {
      const data = await this.getAll();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw createExtensionError(
        'Failed to export storage data',
        'STORAGE_ERROR',
        'StorageManager.exportData'
      );
    }
  }

  // Import data
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!this.validateImportData(data)) {
        throw new Error('Invalid data format');
      }

      await chrome.storage.sync.clear();
      await chrome.storage.sync.set(data);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw createExtensionError(
        'Failed to import storage data',
        'STORAGE_ERROR',
        'StorageManager.importData'
      );
    }
  }

  // Listen to storage changes
  onChanged(
    callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void
  ): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        callback(changes);
      }
    });
  }

  // Private helper methods
  private getDefaultValue<K extends StorageKey>(key: K): ExtensionStorage[K] {
    switch (key) {
      case STORAGE_KEYS.UI_COMPARISONS:
        return {} as ExtensionStorage[K];
      case STORAGE_KEYS.GLOBAL_SETTINGS:
        return DEFAULT_GLOBAL_SETTINGS as ExtensionStorage[K];
      default:
        return {} as ExtensionStorage[K];
    }
  }

  private mergeDeep<T>(target: T, source: DeepPartial<T>): T {
    if (!source || typeof source !== 'object') {
      return target;
    }

    const result = { ...target };
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
          result[key] = this.mergeDeep(targetValue, sourceValue);
        } else {
          result[key] = sourceValue as any;
        }
      }
    }

    return result;
  }

  private validateImportData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Basic validation - could be expanded
    const validKeys = Object.values(STORAGE_KEYS);
    for (const key in data) {
      if (!validKeys.includes(key as any)) {
        console.warn(`Unknown storage key: ${key}`);
      }
    }

    return true;
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance();

// Export convenience functions

export const getUIComparisons = () => storageManager.get(STORAGE_KEYS.UI_COMPARISONS);
export const setUIComparisons = (comparisons: ExtensionStorage['uiComparisons']) => 
  storageManager.set(STORAGE_KEYS.UI_COMPARISONS, comparisons);

export const getGlobalSettings = () => storageManager.get(STORAGE_KEYS.GLOBAL_SETTINGS);
export const setGlobalSettings = (settings: ExtensionStorage['globalSettings']) => 
  storageManager.set(STORAGE_KEYS.GLOBAL_SETTINGS, settings);