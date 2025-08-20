import { create } from 'zustand';
import { 
  EnvironmentVariable, 
  EnvironmentConfig, 
  CorsConfig, 
  UIOverlay,
  ExtensionStorage 
} from '@/shared/types';
import { 
  storageManager,
  getEnvironments,
  getCorsSettings,
  getUIComparisons,
  getGlobalSettings
} from '@/shared/storage';
import { DEFAULT_CORS_CONFIG, DEFAULT_ENVIRONMENT_CONFIG, DEFAULT_GLOBAL_SETTINGS, STORAGE_KEYS } from '@/shared/constants';

interface ExtensionState {
  // Environment variables
  environments: ExtensionStorage['environments'];
  currentEnvironmentConfig: EnvironmentConfig;
  
  // CORS settings
  corsConfig: CorsConfig;
  corsEnabled: boolean;
  
  // UI Comparator
  uiComparisons: ExtensionStorage['uiComparisons'];
  currentOverlays: UIOverlay[];
  
  // Global settings
  globalSettings: ExtensionStorage['globalSettings'];
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Environment actions
  loadEnvironmentConfig: (domain: string) => Promise<void>;
  saveEnvironmentConfig: (domain: string, config: EnvironmentConfig) => Promise<void>;
  addEnvironmentVariable: (domain: string, variable: EnvironmentVariable) => Promise<void>;
  updateEnvironmentVariable: (domain: string, variable: EnvironmentVariable) => Promise<void>;
  removeEnvironmentVariable: (domain: string, key: string) => Promise<void>;
  toggleEnvironmentVariable: (domain: string, key: string) => Promise<void>;
  toggleGlobalEnvironment: (domain: string, enabled: boolean) => Promise<void>;
  
  // CORS actions
  loadCorsConfig: () => Promise<void>;
  updateCorsConfig: (config: Partial<CorsConfig>) => Promise<void>;
  toggleCors: (enabled: boolean) => Promise<void>;
  
  // UI Comparator actions
  loadOverlays: (url: string) => Promise<void>;
  saveOverlays: (url: string, overlays: UIOverlay[]) => Promise<void>;
  createOverlay: (overlay: UIOverlay) => Promise<void>;
  updateOverlay: (id: string, updates: Partial<UIOverlay>) => Promise<void>;
  removeOverlay: (id: string) => Promise<void>;
  
  // Global settings actions
  loadGlobalSettings: () => Promise<void>;
  updateGlobalSettings: (settings: Partial<ExtensionStorage['globalSettings']>) => Promise<void>;
  
  // Tab memory actions
  saveLastActiveTab: (tabKey: string) => Promise<void>;
  loadLastActiveTab: () => Promise<string>;
  
  // Initialize store
  initializeStore: () => Promise<void>;
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  // Initial state
  environments: {},
  currentEnvironmentConfig: DEFAULT_ENVIRONMENT_CONFIG,
  corsConfig: DEFAULT_CORS_CONFIG,
  corsEnabled: false,
  uiComparisons: {},
  currentOverlays: [],
  globalSettings: DEFAULT_GLOBAL_SETTINGS,
  loading: false,
  error: null,

  // UI actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  // Environment actions
  loadEnvironmentConfig: async (domain: string) => {
    try {
      set({ loading: true, error: null });
      const environments = await getEnvironments();
      const config = environments[domain] || DEFAULT_ENVIRONMENT_CONFIG;
      
      set({ 
        environments, 
        currentEnvironmentConfig: config, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load environment config',
        loading: false 
      });
    }
  },

  saveEnvironmentConfig: async (domain: string, config: EnvironmentConfig) => {
    try {
      set({ loading: true, error: null });
      const environments = get().environments;
      environments[domain] = config;
      
      await storageManager.set(STORAGE_KEYS.ENVIRONMENTS, environments);
      set({ 
        environments, 
        currentEnvironmentConfig: config, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save environment config',
        loading: false 
      });
    }
  },

  addEnvironmentVariable: async (domain: string, variable: EnvironmentVariable) => {
    const config = get().currentEnvironmentConfig;
    const existingIndex = config.variables.findIndex(v => v.key === variable.key);
    
    if (existingIndex >= 0) {
      config.variables[existingIndex] = variable;
    } else {
      config.variables.push(variable);
    }
    
    await get().saveEnvironmentConfig(domain, config);
  },

  updateEnvironmentVariable: async (domain: string, variable: EnvironmentVariable) => {
    const config = get().currentEnvironmentConfig;
    const index = config.variables.findIndex(v => v.key === variable.key);
    
    if (index >= 0) {
      config.variables[index] = variable;
      await get().saveEnvironmentConfig(domain, config);
    }
  },

  removeEnvironmentVariable: async (domain: string, key: string) => {
    const config = get().currentEnvironmentConfig;
    config.variables = config.variables.filter(v => v.key !== key);
    await get().saveEnvironmentConfig(domain, config);
  },

  toggleEnvironmentVariable: async (domain: string, key: string) => {
    const config = get().currentEnvironmentConfig;
    const variable = config.variables.find(v => v.key === key);
    
    if (variable) {
      variable.enabled = !variable.enabled;
      await get().saveEnvironmentConfig(domain, config);
    }
  },

  toggleGlobalEnvironment: async (domain: string, enabled: boolean) => {
    const config = get().currentEnvironmentConfig;
    config.globalEnabled = enabled;
    await get().saveEnvironmentConfig(domain, config);
  },

  // CORS actions
  loadCorsConfig: async () => {
    try {
      set({ loading: true, error: null });
      const config = await getCorsSettings();
      set({ 
        corsConfig: config, 
        corsEnabled: config.enabled, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load CORS config',
        loading: false 
      });
    }
  },

  updateCorsConfig: async (updates: Partial<CorsConfig>) => {
    try {
      set({ loading: true, error: null });
      const newConfig = { ...get().corsConfig, ...updates };
      
      await storageManager.set(STORAGE_KEYS.CORS_SETTINGS, newConfig);
      
      // Notify background script of the change
      await chrome.runtime.sendMessage({
        type: 'CORS_STATUS_CHANGED',
        payload: { enabled: newConfig.enabled }
      });
      
      set({ 
        corsConfig: newConfig, 
        corsEnabled: newConfig.enabled, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update CORS config',
        loading: false 
      });
    }
  },

  toggleCors: async (enabled: boolean) => {
    await get().updateCorsConfig({ enabled });
  },

  // UI Comparator actions
  loadOverlays: async (url: string) => {
    try {
      set({ loading: true, error: null });
      const comparisons = await getUIComparisons();
      const overlays = comparisons[url]?.overlays || [];
      
      set({ 
        uiComparisons: comparisons, 
        currentOverlays: overlays, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load overlays',
        loading: false 
      });
    }
  },

  saveOverlays: async (url: string, overlays: UIOverlay[]) => {
    try {
      console.log('Saving overlays for URL:', url, overlays);
      
      const comparisons = get().uiComparisons;
      comparisons[url] = { ...comparisons[url], overlays };
      
      console.log('Saving to storage:', comparisons);
      
      await storageManager.set(STORAGE_KEYS.UI_COMPARISONS, comparisons);
      set({ uiComparisons: comparisons, currentOverlays: overlays });
      
      console.log('Successfully saved overlays');
    } catch (error) {
      console.error('Failed to save overlays:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save overlays';
      set({ error: errorMessage });
      throw new Error(errorMessage); // Re-throw the error so it can be caught by caller
    }
  },

  createOverlay: async (overlay: UIOverlay) => {
    console.log('Creating overlay in store:', overlay);
    
    const overlays = [...get().currentOverlays, overlay];
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    console.log('Current tab:', tab);
    
    if (tab.url) {
      await get().saveOverlays(tab.url, overlays);
      
      console.log('Sending CREATE_OVERLAY message to background script');
      
      // Send message to content script
      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_OVERLAY',
        payload: overlay,
        tabId: tab.id
      });
      
      console.log('CREATE_OVERLAY response from background script:', response);
    } else {
      console.error('No tab URL found');
    }
  },

  updateOverlay: async (id: string, updates: Partial<UIOverlay>) => {
    const overlays = get().currentOverlays.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    );
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url) {
      await get().saveOverlays(tab.url, overlays);
      
      // Send message to content script
      await chrome.runtime.sendMessage({
        type: 'UPDATE_OVERLAY',
        payload: { id, updates },
        tabId: tab.id
      });
    }
  },

  removeOverlay: async (id: string) => {
    const overlays = get().currentOverlays.filter(overlay => overlay.id !== id);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url) {
      await get().saveOverlays(tab.url, overlays);
      
      // Send message to content script
      await chrome.runtime.sendMessage({
        type: 'REMOVE_OVERLAY',
        payload: { id },
        tabId: tab.id
      });
    }
  },

  // Global settings actions
  loadGlobalSettings: async () => {
    try {
      const settings = await getGlobalSettings();
      set({ globalSettings: settings });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load global settings'
      });
    }
  },

  updateGlobalSettings: async (updates: Partial<ExtensionStorage['globalSettings']>) => {
    try {
      const newSettings = { ...get().globalSettings, ...updates };
      await storageManager.set(STORAGE_KEYS.GLOBAL_SETTINGS, newSettings);
      set({ globalSettings: newSettings });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update global settings'
      });
    }
  },

  // Tab memory actions
  saveLastActiveTab: async (tabKey: string) => {
    try {
      await storageManager.set(STORAGE_KEYS.LAST_ACTIVE_TAB, tabKey);
      // Also update global settings
      const newSettings = { ...get().globalSettings, lastActiveTab: tabKey };
      await storageManager.set(STORAGE_KEYS.GLOBAL_SETTINGS, newSettings);
      set({ globalSettings: newSettings });
    } catch (error) {
      console.error('Failed to save last active tab:', error);
    }
  },

  loadLastActiveTab: () => {
    const settings = get().globalSettings;
    return settings.lastActiveTab || 'environment';
  },

  // Initialize store
  initializeStore: async () => {
    try {
      set({ loading: true, error: null });
      
      // Load all initial data
      await Promise.all([
        get().loadCorsConfig(),
        get().loadGlobalSettings(),
      ]);
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize store',
        loading: false 
      });
    }
  },
}));