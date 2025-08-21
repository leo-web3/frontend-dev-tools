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
    try {
      console.log('Creating overlay in store:', overlay);
      
      const overlays = [...get().currentOverlays, overlay];
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      console.log('Current tab:', tab);
      
      if (!tab.url) {
        throw new Error('无法获取当前页面信息');
      }

      await get().saveOverlays(tab.url, overlays);
      
      console.log('Sending CREATE_OVERLAY message to background script');
      
      // Send message to content script
      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_OVERLAY',
        payload: overlay,
        tabId: tab.id
      });
      
      console.log('CREATE_OVERLAY response from background script:', response);

      if (!response?.success) {
        // Handle specific content script injection failures
        if (response?.error?.includes('Content script not available')) {
          throw new Error('插件需要页面刷新才能正常工作。请刷新页面后重试。');
        } else if (response?.error?.includes('Cannot inject content script into browser internal pages')) {
          throw new Error('此页面不支持UI比对功能（浏览器内部页面）');
        } else {
          throw new Error(response?.error || '创建图层失败');
        }
      }
    } catch (error) {
      console.error('Failed to create overlay:', error);
      const errorMessage = error instanceof Error ? error.message : '创建图层失败';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateOverlay: async (id: string, updates: Partial<UIOverlay>) => {
    try {
      console.log('[Popup Store] updateOverlay called:', { id, updates });
      
      const overlays = get().currentOverlays.map(overlay => 
        overlay.id === id ? { ...overlay, ...updates } : overlay
      );
      
      console.log('[Popup Store] Updated overlays array:', overlays);
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url) {
        throw new Error('无法获取当前页面信息');
      }

      console.log('[Popup Store] Saving overlays to storage for tab:', { url: tab.url, tabId: tab.id });
      await get().saveOverlays(tab.url, overlays);
      
      console.log('[Popup Store] Sending UPDATE_OVERLAY message to background script');
      // Send message to content script
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_OVERLAY',
        payload: { id, updates },
        tabId: tab.id
      });

      console.log('[Popup Store] UPDATE_OVERLAY response:', response);

      if (!response?.success) {
        // Handle specific content script injection failures
        if (response?.error?.includes('Content script not available')) {
          throw new Error('插件需要页面刷新才能正常工作。请刷新页面后重试。');
        } else if (response?.error?.includes('Cannot inject content script into browser internal pages')) {
          throw new Error('此页面不支持UI比对功能（浏览器内部页面）');
        } else {
          throw new Error(response?.error || '更新图层失败');
        }
      }
      
      console.log('[Popup Store] updateOverlay completed successfully');
    } catch (error) {
      console.error('[Popup Store] Failed to update overlay:', error);
      const errorMessage = error instanceof Error ? error.message : '更新图层失败';
      set({ error: errorMessage });
      throw error;
    }
  },

  removeOverlay: async (id: string) => {
    try {
      const overlays = get().currentOverlays.filter(overlay => overlay.id !== id);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url) {
        throw new Error('无法获取当前页面信息');
      }

      await get().saveOverlays(tab.url, overlays);
      
      // Send message to content script
      const response = await chrome.runtime.sendMessage({
        type: 'REMOVE_OVERLAY',
        payload: { id },
        tabId: tab.id
      });

      if (!response?.success) {
        // Handle specific content script injection failures
        if (response?.error?.includes('Content script not available')) {
          throw new Error('插件需要页面刷新才能正常工作。请刷新页面后重试。');
        } else if (response?.error?.includes('Cannot inject content script into browser internal pages')) {
          throw new Error('此页面不支持UI比对功能（浏览器内部页面）');
        } else {
          throw new Error(response?.error || '删除图层失败');
        }
      }
    } catch (error) {
      console.error('Failed to remove overlay:', error);
      const errorMessage = error instanceof Error ? error.message : '删除图层失败';
      set({ error: errorMessage });
      throw error;
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
      
      // Set up message listener for overlay state changes
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[Popup] Received message:', message);
        
        if (message.type === 'OVERLAY_STATE_CHANGED') {
          const { url, overlayId, updates } = message.payload;
          
          console.log('[Popup] OVERLAY_STATE_CHANGED received:', { url, overlayId, updates });
          
          // Get current tab URL to see if this update affects current overlays
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            console.log('[Popup] Current tab:', currentTab);
            
            if (currentTab?.url === url) {
              console.log('[Popup] URL matches, updating overlays');
              
              // Update the current overlays state
              const currentOverlays = get().currentOverlays;
              console.log('[Popup] Current overlays before update:', currentOverlays);
              
              const updatedOverlays = currentOverlays.map(overlay =>
                overlay.id === overlayId ? { ...overlay, ...updates } : overlay
              );
              
              console.log('[Popup] Updated overlays:', updatedOverlays);
              
              set({ currentOverlays: updatedOverlays });
              console.log('[Popup] State updated successfully');
            } else {
              console.log('[Popup] URL does not match current tab, ignoring update');
            }
            
            // Send response to prevent runtime error
            sendResponse({ success: true });
          });
          
          // Return true to indicate we will send a response asynchronously
          return true;
        }
        
        // For other message types, don't send response
        return false;
      });
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize store',
        loading: false 
      });
    }
  },
}));