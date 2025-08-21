import { MESSAGE_TYPES } from "@/shared/constants";
import { ExtensionResponse, Message, UIOverlay } from "@/shared/types";
import { UIComparator } from "./uiComparator";
import { DeviceSimulator } from "./components/DeviceSimulator";

class ContentScript {
  private static instance: ContentScript;
  private uiComparator: UIComparator;
  private deviceSimulator: DeviceSimulator;

  static getInstance(): ContentScript {
    if (!ContentScript.instance) {
      ContentScript.instance = new ContentScript();
    }
    return ContentScript.instance;
  }

  constructor() {
    this.uiComparator = new UIComparator();
    this.deviceSimulator = new DeviceSimulator();
    this.initializeMessageListeners();
    this.initializePageObserver();
  }

  private initializeMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
      this.handleMessage(message).then(sendResponse);
      return true; // Keep the message channel open for async response
    });
  }

  private async handleMessage(message: Message): Promise<ExtensionResponse> {
    try {
      const { type, payload } = message;

      switch (type) {
        case MESSAGE_TYPES.CREATE_OVERLAY:
          return await this.uiComparator.createOverlay(payload as UIOverlay);

        case MESSAGE_TYPES.UPDATE_OVERLAY:
          return await this.uiComparator.updateOverlay(payload.id, payload.updates);

        case MESSAGE_TYPES.REMOVE_OVERLAY:
          return await this.uiComparator.removeOverlay(payload.id);

        case MESSAGE_TYPES.TOGGLE_OVERLAY_VISIBILITY:
          return await this.uiComparator.toggleVisibility(payload.id);

        case MESSAGE_TYPES.GET_VIEWPORT_DIMENSIONS:
          return {
            success: true,
            data: {
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight,
              outerWidth: window.outerWidth,
              outerHeight: window.outerHeight,
              devicePixelRatio: window.devicePixelRatio,
              screenWidth: window.screen.availWidth,
              screenHeight: window.screen.availHeight,
            },
          };

        case MESSAGE_TYPES.PING:
          // Respond to content script availability check
          return {
            success: true,
            data: "Content script is available",
          };

        case MESSAGE_TYPES.GET_SIMULATOR_STATUS:
          return {
            success: true,
            data: this.deviceSimulator.getState(),
          };

        case MESSAGE_TYPES.ENABLE_VIEWPORT_SIMULATOR:
          this.deviceSimulator.enable(payload?.deviceId);
          return {
            success: true,
            data: "Viewport simulator enabled",
          };

        case MESSAGE_TYPES.DISABLE_VIEWPORT_SIMULATOR:
          this.deviceSimulator.disable();
          return {
            success: true,
            data: "Viewport simulator disabled",
          };

        case MESSAGE_TYPES.SWITCH_DEVICE:
          this.deviceSimulator.switchDevice(payload?.deviceId);
          return {
            success: true,
            data: "Device switched",
          };

        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error("Error handling content script message:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private initializePageObserver(): void {
    // Listen for page navigation changes
    if ("navigation" in window) {
      // Use Navigation API if available (modern browsers)
      (window as any).navigation.addEventListener("navigate", () => {
        this.onPageChange();
      });
    } else {
      // Fallback: listen for popstate events
      window.addEventListener("popstate", () => {
        this.onPageChange();
      });
    }

    // Listen for DOM content changes that might affect overlays
    const initObserver = () => {
      if (document.body) {
        const observer = new MutationObserver(() => {
          this.uiComparator.adjustOverlaysToPageChanges();
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["style", "class"],
        });
      } else {
        // Wait for document.body to be available
        setTimeout(initObserver, 10);
      }
    };

    initObserver();
  }

  private onPageChange(): void {
    // Clear overlays when navigating to a new page
    setTimeout(() => {
      this.uiComparator.clearAllOverlays();
      this.loadOverlaysForCurrentPage();
    }, 100);
  }

  private async loadOverlaysForCurrentPage(): Promise<void> {
    try {
      // Request background script to load overlays for current URL
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.LOAD_CONFIG,
        payload: { url: window.location.href },
      });

      if (response.success && response.data?.overlays && response.data.overlays.length > 0) {
        for (const overlay of response.data.overlays) {
          await this.uiComparator.createOverlay(overlay);
        }
      } else {
        // Ensure all overlays are cleared if no data exists
        this.uiComparator.clearAllOverlays();
      }
    } catch (error) {
      console.error("Failed to load overlays for current page:", error);
    }
  }

  // Initialize on page load
  initialize(): void {
    // Wait for document.body to be available before showing indicator
    const showIndicatorWhenReady = () => {
      if (!document.body) {
        setTimeout(showIndicatorWhenReady, 10);
        return;
      }

      // Add a visible indicator that content script is loaded
      const indicator = document.createElement("div");
      indicator.id = "fe-dev-tools-indicator";
      indicator.textContent = "FE Dev Tools Loaded";
      indicator.style.cssText = `
        position: fixed !important;
        top: 10px !important;
        left: 10px !important;
        background: #10b981 !important;
        color: white !important;
        padding: 4px 8px !important;
        font-size: 12px !important;
        z-index: 999999 !important;
        border-radius: 4px !important;
      `;
      document.body.appendChild(indicator);

      // Remove indicator after 3 seconds
      setTimeout(() => {
        indicator?.remove();
      }, 3000);
    };

    showIndicatorWhenReady();

    // Load overlays for current page if any exist
    if (document.readyState === "complete") {
      this.loadOverlaysForCurrentPage();
    } else {
      window.addEventListener("load", () => {
        this.loadOverlaysForCurrentPage();
      });
    }
  }

  // Cleanup method
  cleanup(): void {
    this.uiComparator.clearAllOverlays();
    this.deviceSimulator.disable();
  }
}

// Initialize the content script
const contentScript = ContentScript.getInstance();
contentScript.initialize();

// Listen for page unload to cleanup
window.addEventListener("beforeunload", () => {
  contentScript.cleanup();
});

// Handle extension updates
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    contentScript.cleanup();
  });
});

// Export for testing purposes
export default contentScript;
