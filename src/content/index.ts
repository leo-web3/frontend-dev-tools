import { Message, ExtensionResponse, UIOverlay } from '@/shared/types';
import { MESSAGE_TYPES } from '@/shared/constants';
import { UIComparator } from './uiComparator';

class ContentScript {
  private static instance: ContentScript;
  private uiComparator: UIComparator;
  
  static getInstance(): ContentScript {
    if (!ContentScript.instance) {
      ContentScript.instance = new ContentScript();
    }
    return ContentScript.instance;
  }

  constructor() {
    this.uiComparator = new UIComparator();
    this.initializeMessageListeners();
    this.initializePageObserver();
  }

  private initializeMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, _sender, sendResponse) => {
        this.handleMessage(message).then(sendResponse);
        return true; // Keep the message channel open for async response
      }
    );
  }

  private async handleMessage(message: Message): Promise<ExtensionResponse> {
    try {
      const { type, payload } = message;

      console.log('Content script received message:', type, payload);

      switch (type) {
        case MESSAGE_TYPES.CREATE_OVERLAY:
          return await this.uiComparator.createOverlay(payload as UIOverlay);

        case MESSAGE_TYPES.UPDATE_OVERLAY:
          return await this.uiComparator.updateOverlay(payload.id, payload.updates);

        case MESSAGE_TYPES.REMOVE_OVERLAY:
          return await this.uiComparator.removeOverlay(payload.id);

        case MESSAGE_TYPES.TOGGLE_OVERLAY_VISIBILITY:
          return await this.uiComparator.toggleVisibility(payload.id);

        case MESSAGE_TYPES.CORS_STATUS_CHANGED:
          return this.handleCorsStatusChange(payload.enabled);

        case 'GET_VIEWPORT_DIMENSIONS':
          return {
            success: true,
            data: {
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight,
              outerWidth: window.outerWidth,
              outerHeight: window.outerHeight,
              devicePixelRatio: window.devicePixelRatio,
              screenWidth: window.screen.width,
              screenHeight: window.screen.height,
            },
          };

        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('Error handling content script message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private handleCorsStatusChange(enabled: boolean): ExtensionResponse {
    // Display a notification to the user about CORS status change
    this.showNotification(
      `CORS ${enabled ? 'enabled' : 'disabled'}`, 
      enabled ? 'success' : 'info'
    );

    return { success: true };
  }

  private initializePageObserver(): void {
    // Listen for page navigation changes
    if ('navigation' in window) {
      // Use Navigation API if available (modern browsers)
      (window as any).navigation.addEventListener('navigate', () => {
        this.onPageChange();
      });
    } else {
      // Fallback: listen for popstate events
      window.addEventListener('popstate', () => {
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
          attributeFilter: ['style', 'class']
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
        payload: { url: window.location.href }
      });

      if (response.success && response.data?.overlays) {
        for (const overlay of response.data.overlays) {
          await this.uiComparator.createOverlay(overlay);
        }
      }
    } catch (error) {
      console.error('Failed to load overlays for current page:', error);
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    // Wait for document.body to be available
    const showNotificationWhenReady = () => {
      if (!document.body) {
        setTimeout(showNotificationWhenReady, 10);
        return;
      }

      // Create a simple notification overlay
      const notification = document.createElement('div');
      notification.className = `fe-dev-tools-notification fe-dev-tools-notification--${type}`;
      notification.textContent = message;
      
      // Apply styles
      const styles = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'} !important;
        color: white !important;
        padding: 12px 16px !important;
        border-radius: 6px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        z-index: 999999 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        transition: all 0.3s ease !important;
        opacity: 0 !important;
        transform: translateX(100%) !important;
      `;
      
      notification.setAttribute('style', styles);
      document.body.appendChild(notification);

      // Animate in
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      });

      // Remove after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    };

    showNotificationWhenReady();
  }

  // Initialize on page load
  initialize(): void {
    console.log('[FE Dev Tools] Content script initialized on URL:', window.location.href);
    console.log('[FE Dev Tools] Document ready state:', document.readyState);
    
    // Wait for document.body to be available before showing indicator
    const showIndicatorWhenReady = () => {
      if (!document.body) {
        setTimeout(showIndicatorWhenReady, 10);
        return;
      }

      // Add a visible indicator that content script is loaded
      const indicator = document.createElement('div');
      indicator.id = 'fe-dev-tools-indicator';
      indicator.textContent = 'FE Dev Tools Loaded';
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
    if (document.readyState === 'complete') {
      this.loadOverlaysForCurrentPage();
    } else {
      window.addEventListener('load', () => {
        this.loadOverlaysForCurrentPage();
      });
    }
  }

  // Cleanup method
  cleanup(): void {
    this.uiComparator.clearAllOverlays();
  }
}

// Initialize the content script
const contentScript = ContentScript.getInstance();
contentScript.initialize();

// Listen for page unload to cleanup
window.addEventListener('beforeunload', () => {
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