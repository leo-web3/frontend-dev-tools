import { Message, ExtensionResponse, MessageType } from '@/shared/types';
import { MESSAGE_TYPES } from '@/shared/constants';

class BackgroundService {
  private static instance: BackgroundService;
  
  static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  constructor() {
    this.initializeMessageListeners();
    this.initializeContextMenus();
    this.initializeTabListeners();
  }

  private initializeMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        this.handleMessage(message, sender).then(sendResponse);
        return true; // Keep the message channel open for async response
      }
    );
  }

  private async handleMessage(
    message: Message, 
    sender: chrome.runtime.MessageSender
  ): Promise<ExtensionResponse> {
    try {
      const { type, payload, tabId } = message;
      const targetTabId = tabId || sender.tab?.id;

      console.log('Background received message:', type, payload);

      switch (type) {
        case MESSAGE_TYPES.GET_CURRENT_TAB:
          return await this.getCurrentTabInfo();

        case MESSAGE_TYPES.ADJUST_BROWSER_SIZE:
          return await this.adjustBrowserSize(payload.width, payload.height);

        case MESSAGE_TYPES.CREATE_OVERLAY:
        case MESSAGE_TYPES.UPDATE_OVERLAY:
        case MESSAGE_TYPES.REMOVE_OVERLAY:
        case MESSAGE_TYPES.TOGGLE_OVERLAY_VISIBILITY:
          return await this.forwardToContentScript(message, targetTabId!);

        case MESSAGE_TYPES.SAVE_CONFIG:
        case MESSAGE_TYPES.LOAD_CONFIG:
          return await this.handleConfigMessage(message);

        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getCurrentTabInfo(): Promise<ExtensionResponse> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab) {
          resolve({
            success: true,
            data: {
              id: tab.id,
              url: tab.url,
              title: tab.title,
            },
          });
        } else {
          resolve({
            success: false,
            error: 'No active tab found',
          });
        }
      });
    });
  }

  private async adjustBrowserSize(
    width: number, 
    height: number | null
  ): Promise<ExtensionResponse> {
    try {
      console.log('Adjusting browser size to viewport:', { width, height });
      
      // Validate input parameters
      if (!width || width <= 0 || !Number.isFinite(width)) {
        return {
          success: false,
          error: 'Invalid width parameter. Width must be a positive number.',
        };
      }
      
      if (height !== null && (height <= 0 || !Number.isFinite(height))) {
        return {
          success: false,
          error: 'Invalid height parameter. Height must be a positive number or null.',
        };
      }
      
      return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError || !tabs[0]) {
            resolve({
              success: false,
              error: 'Failed to get active tab',
            });
            return;
          }

          const tab = tabs[0];
          
          // First get viewport dimensions from the content script with retry mechanism
          const getViewportDimensions = (retryCount = 0): Promise<any> => {
            return new Promise((resolveViewport) => {
              chrome.tabs.sendMessage(tab.id!, {
                type: 'GET_VIEWPORT_DIMENSIONS'
              }, (response) => {
                if (chrome.runtime.lastError || !response?.success) {
                  console.warn(`Failed to get viewport dimensions (attempt ${retryCount + 1}):`, chrome.runtime.lastError?.message);
                  
                  // Retry up to 3 times with delays
                  if (retryCount < 3) {
                    setTimeout(() => {
                      getViewportDimensions(retryCount + 1).then(resolveViewport);
                    }, 500 * (retryCount + 1)); // Increasing delay: 500ms, 1s, 1.5s
                  } else {
                    // Fallback to default values
                    console.warn('Using fallback viewport dimensions');
                    resolveViewport({
                      success: true,
                      data: {
                        innerWidth: 1200, // Fallback viewport width
                        innerHeight: 800, // Fallback viewport height
                        screenWidth: 1920, // Fallback screen width
                        screenHeight: 1080, // Fallback screen height
                      }
                    });
                  }
                } else {
                  resolveViewport(response);
                }
              });
            });
          };

          getViewportDimensions().then((response) => {
            const { innerWidth, innerHeight, screenWidth, screenHeight } = response.data || {};
            
            // Get the window that contains the tab, not the current active window
            chrome.windows.get(tab.windowId, (targetWindow) => {
              if (chrome.runtime.lastError) {
                console.error('Error getting target window:', chrome.runtime.lastError);
                resolve({
                  success: false,
                  error: `Failed to get target window: ${chrome.runtime.lastError.message}`,
                });
                return;
              }

              console.log('Target window:', targetWindow);
              console.log('Current viewport:', { innerWidth, innerHeight });
              
              if (targetWindow?.id && targetWindow.width && innerWidth) {
                // Calculate the difference between window size and viewport size
                const widthDiff = targetWindow.width - innerWidth;
                
                // Calculate new window size to achieve desired viewport width
                const calculatedWidth = width + widthDiff;
                // Keep current height if height parameter is null
                const calculatedHeight = height !== null && targetWindow.height && innerHeight 
                  ? height + (targetWindow.height - innerHeight) 
                  : targetWindow.height;
                
                // Validate calculated dimensions (must be positive integers)
                const newWindowWidth = Math.max(100, Math.round(calculatedWidth)); // Minimum 100px width
                const newWindowHeight = Math.max(100, Math.round(calculatedHeight || targetWindow.height)); // Minimum 100px height
                
                console.log('Calculated adjustments:', { 
                  widthDiff, 
                  calculatedWidth,
                  calculatedHeight,
                  newWindowWidth, 
                  newWindowHeight,
                  heightAdjusted: height !== null
                });

                // Additional validation before calling chrome.windows.update
                if (newWindowWidth <= 0 || newWindowHeight <= 0) {
                  console.error('Invalid window dimensions:', { newWindowWidth, newWindowHeight });
                  resolve({
                    success: false,
                    error: 'Calculated window dimensions are invalid',
                  });
                  return;
                }

                // Get screen dimensions and validate window bounds  
                const safeScreenWidth = screenWidth || 1920;
                const safeScreenHeight = screenHeight || 1080;
                
                // Ensure window doesn't exceed screen size
                const maxWidth = Math.floor(safeScreenWidth * 0.95); // 95% of screen width
                const maxHeight = Math.floor(safeScreenHeight * 0.95); // 95% of screen height
                
                const finalWidth = Math.min(newWindowWidth, maxWidth);
                const finalHeight = Math.min(newWindowHeight, maxHeight);
                
                console.log('Final window update params:', {
                  width: finalWidth,
                  height: finalHeight,
                  screenWidth: safeScreenWidth,
                  screenHeight: safeScreenHeight
                });

                chrome.windows.update(targetWindow.id, {
                  width: finalWidth,
                  height: finalHeight,
                }, (updatedWindow) => {
                  if (chrome.runtime.lastError) {
                    console.error('Error updating window:', chrome.runtime.lastError);
                    resolve({
                      success: false,
                      error: `Failed to update window: ${chrome.runtime.lastError.message}`,
                    });
                  } else {
                    console.log('Window updated successfully:', updatedWindow);
                    resolve({
                      success: true,
                      data: {
                        windowWidth: updatedWindow?.width,
                        windowHeight: updatedWindow?.height,
                        viewportWidth: width,
                        viewportHeight: height !== null ? height : 'unchanged',
                        finalWidth,
                        finalHeight,
                        widthDiff,
                        heightAdjusted: height !== null,
                        screenConstrained: finalWidth !== newWindowWidth || finalHeight !== newWindowHeight,
                      },
                    });
                  }
                });
              } else {
                console.error('Missing window or viewport information');
                resolve({
                  success: false,
                  error: 'Unable to determine window or viewport dimensions',
                });
              }
            });
          });
        });
      });
    } catch (error) {
      console.error('Unexpected error in adjustBrowserSize:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error',
      };
    }
  }

  private async forwardToContentScript(
    message: Message, 
    tabId: number
  ): Promise<ExtensionResponse> {
    console.log('Forwarding message to content script:', { message, tabId });
    
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error forwarding to content script:', chrome.runtime.lastError);
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          console.log('Content script response:', response);
          resolve(response || { success: true });
        }
      });
    });
  }

  private async handleConfigMessage(message: Message): Promise<ExtensionResponse> {
    // Implementation will be added when we create the config management system
    return {
      success: true,
      data: null,
    };
  }

  private initializeContextMenus(): void {
    chrome.runtime.onInstalled.addListener(() => {
      try {
        // Create context menu items
        chrome.contextMenus.create({
          id: 'fe-dev-tools-main',
          title: 'Frontend Dev Tools',
          contexts: ['page'],
        });

      } catch (error) {
        console.error('Failed to create context menus:', error);
      }
    });

    // Add safety check for onClicked
    if (chrome.contextMenus && chrome.contextMenus.onClicked) {
      chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        try {
          if (!tab?.id) return;

          // No context menu actions needed
        } catch (error) {
          console.error('Error handling context menu click:', error);
        }
      });
    } else {
      console.warn('chrome.contextMenus.onClicked is not available');
    }
  }

  private initializeTabListeners(): void {
    // Add safety check for tab listeners
    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        // Tab update handling (if needed in the future)
      });
    } else {
      console.warn('chrome.tabs.onUpdated is not available');
    }

    // Add safety check for tab creation listener
    if (chrome.tabs && chrome.tabs.onCreated) {
      chrome.tabs.onCreated.addListener(async (tab) => {
        // Tab creation handling (if needed in the future)
      });
    } else {
      console.warn('chrome.tabs.onCreated is not available');
    }
  }

  // Extension lifecycle methods
  initialize(): void {
    console.log('Background service initialized');
  }

  cleanup(): void {
    console.log('Background service cleanup');
  }
}

// Safely initialize the background service
let backgroundService: BackgroundService | null = null;

try {
  backgroundService = BackgroundService.getInstance();
  backgroundService.initialize();
} catch (error) {
  console.error('Failed to initialize background service:', error);
}

// Handle extension lifecycle events with error handling
try {
  chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
  });
} catch (error) {
  console.error('Failed to setup startup listener:', error);
}

try {
  chrome.runtime.onSuspend.addListener(() => {
    backgroundService?.cleanup();
  });
} catch (error) {
  console.error('Failed to setup suspend listener:', error);
}

// Export for testing purposes
export default backgroundService;