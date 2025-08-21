import { create } from 'zustand';
import { 
  UIOverlay,
  ExtensionStorage 
} from '@/shared/types';
import { 
  storageManager,
  getUIComparisons,
  getGlobalSettings
} from '@/shared/storage';
import { DEFAULT_GLOBAL_SETTINGS, STORAGE_KEYS } from '@/shared/constants';

interface ExtensionState {
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
  loadLastActiveTab: () => string;
  
  // Initialize store
  initializeStore: () => Promise<void>;
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  // Initial state
  uiComparisons: {},
  currentOverlays: [],
  globalSettings: DEFAULT_GLOBAL_SETTINGS,
  loading: false,
  error: null,

  // UI actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),


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
    return settings.lastActiveTab || 'ui-comparator';
  },

  // Initialize store
  initializeStore: async () => {
    try {
      set({ loading: true, error: null });
      
      // Load all initial data
      await get().loadGlobalSettings();
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize store',
        loading: false 
      });
    }
  },
}));