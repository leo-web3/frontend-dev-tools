import { DEFAULT_GLOBAL_SETTINGS, STORAGE_KEYS } from "@/shared/constants";
import { getGlobalSettings, getUIComparisons, storageManager } from "@/shared/storage";
import { ExtensionStorage, UIOverlay } from "@/shared/types";
import { create } from "zustand";

interface ExtensionState {
  // UI Comparator
  uiComparisons: ExtensionStorage["uiComparisons"];
  currentOverlays: UIOverlay[];

  // Global settings
  globalSettings: ExtensionStorage["globalSettings"];

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
  updateGlobalSettings: (settings: Partial<ExtensionStorage["globalSettings"]>) => Promise<void>;

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
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load overlays",
        loading: false,
      });
    }
  },

  saveOverlays: async (url: string, overlays: UIOverlay[]) => {
    try {
      const comparisons = get().uiComparisons;
      comparisons[url] = { ...comparisons[url], overlays };

      await storageManager.set(STORAGE_KEYS.UI_COMPARISONS, comparisons);
      set({ uiComparisons: comparisons, currentOverlays: overlays });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save overlays";
      set({ error: errorMessage });
      throw new Error(errorMessage); // Re-throw the error so it can be caught by caller
    }
  },

  createOverlay: async (overlay: UIOverlay) => {
    try {
      const overlays = [...get().currentOverlays, overlay];
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url) {
        throw new Error("error.no_page_info");
      }

      await get().saveOverlays(tab.url, overlays);

      // Send message to content script
      const response = await chrome.runtime.sendMessage({
        type: "CREATE_OVERLAY",
        payload: overlay,
        tabId: tab.id,
      });

      if (!response?.success) {
        // Handle specific content script injection failures
        if (response?.error?.includes("Content script not available")) {
          throw new Error("error.need_refresh");
        } else if (
          response?.error?.includes("Cannot inject content script into browser internal pages")
        ) {
          throw new Error("error.unsupported_page");
        } else {
          throw new Error(response?.error || "error.create_layer_failed");
        }
      }
    } catch (error) {
      console.error("Failed to create overlay:", error);
      const errorMessage = error instanceof Error ? error.message : "error.create_layer_failed";
      set({ error: errorMessage });
      throw error;
    }
  },

  updateOverlay: async (id: string, updates: Partial<UIOverlay>) => {
    try {
      const overlays = get().currentOverlays.map((overlay) =>
        overlay.id === id ? { ...overlay, ...updates } : overlay
      );

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url) {
        throw new Error("error.no_page_info");
      }

      await get().saveOverlays(tab.url, overlays);

      // Send message to content script
      const response = await chrome.runtime.sendMessage({
        type: "UPDATE_OVERLAY",
        payload: { id, updates },
        tabId: tab.id,
      });

      if (!response?.success) {
        // Handle specific content script injection failures
        if (response?.error?.includes("Content script not available")) {
          throw new Error("error.need_refresh");
        } else if (
          response?.error?.includes("Cannot inject content script into browser internal pages")
        ) {
          throw new Error("error.unsupported_page");
        } else {
          throw new Error(response?.error || "error.update_layer_failed");
        }
      }
    } catch (error) {
      console.error("[Popup Store] Failed to update overlay:", error);
      const errorMessage = error instanceof Error ? error.message : "error.update_layer_failed";
      set({ error: errorMessage });
      throw error;
    }
  },

  removeOverlay: async (id: string) => {
    try {
      const overlays = get().currentOverlays.filter((overlay) => overlay.id !== id);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url) {
        throw new Error("error.no_page_info");
      }

      await get().saveOverlays(tab.url, overlays);

      // Send message to content script
      const response = await chrome.runtime.sendMessage({
        type: "REMOVE_OVERLAY",
        payload: { id },
        tabId: tab.id,
      });

      if (!response?.success) {
        // Handle specific content script injection failures
        if (response?.error?.includes("Content script not available")) {
          throw new Error("error.need_refresh");
        } else if (
          response?.error?.includes("Cannot inject content script into browser internal pages")
        ) {
          throw new Error("error.unsupported_page");
        } else {
          throw new Error(response?.error || "error.delete_layer_failed");
        }
      }
    } catch (error) {
      console.error("Failed to remove overlay:", error);
      const errorMessage = error instanceof Error ? error.message : "error.delete_layer_failed";
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
        error: error instanceof Error ? error.message : "Failed to load global settings",
      });
    }
  },

  updateGlobalSettings: async (updates: Partial<ExtensionStorage["globalSettings"]>) => {
    try {
      const newSettings = { ...get().globalSettings, ...updates };
      await storageManager.set(STORAGE_KEYS.GLOBAL_SETTINGS, newSettings);
      set({ globalSettings: newSettings });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update global settings",
      });
    }
  },

  // Tab memory actions
  saveLastActiveTab: async (tabKey: string) => {
    try {
      await storageManager.set('lastActiveTab' as any, tabKey);
      // Also update global settings
      const newSettings = { ...get().globalSettings, lastActiveTab: tabKey };
      await storageManager.set(STORAGE_KEYS.GLOBAL_SETTINGS, newSettings);
      set({ globalSettings: newSettings });
    } catch (error) {
      console.error("Failed to save last active tab:", error);
    }
  },

  loadLastActiveTab: () => {
    const settings = get().globalSettings;
    return settings.lastActiveTab || "ui-comparator";
  },

  // Initialize store
  initializeStore: async () => {
    try {
      set({ loading: true, error: null });

      // Load all initial data
      await get().loadGlobalSettings();

      // Set up message listener for overlay state changes
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === "OVERLAY_STATE_CHANGED") {
          const { url, overlayId, updates } = message.payload;

          // Get current tab URL to see if this update affects current overlays
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];

            if (currentTab?.url === url) {
              // Update the current overlays state
              const currentOverlays = get().currentOverlays;
              const updatedOverlays = currentOverlays.map((overlay) =>
                overlay.id === overlayId ? { ...overlay, ...updates } : overlay
              );
              set({ currentOverlays: updatedOverlays });
            } else {
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
        error: error instanceof Error ? error.message : "Failed to initialize store",
        loading: false,
      });
    }
  },
}));
