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
                type: MESSAGE_TYPES.GET_VIEWPORT_DIMENSIONS
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
                // Calculate how much we need to adjust the browser window width
                // 目标调整的宽度 - 当前视口宽度 = 需要调整的宽度
                const widthAdjustment = width - innerWidth;
                
                // Apply the width adjustment to current window width
                const calculatedWidth = targetWindow.width + widthAdjustment;
                
                // Keep current height if height parameter is null, otherwise adjust height similarly
                const calculatedHeight = height !== null && targetWindow.height && innerHeight 
                  ? targetWindow.height + (height - innerHeight) 
                  : targetWindow.height;
                
                // Validate calculated dimensions (must be positive integers)
                const newWindowWidth = Math.max(100, Math.round(calculatedWidth)); // Minimum 100px width
                const newWindowHeight = Math.max(100, Math.round(calculatedHeight || targetWindow.height)); // Minimum 100px height
                
                console.log('Calculated adjustments:', { 
                  widthAdjustment, 
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
                        widthAdjustment,
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
    
    return new Promise(async (resolve) => {
      // First check if content script is available
      chrome.tabs.sendMessage(tabId, { type: MESSAGE_TYPES.PING }, async (response) => {
        if (chrome.runtime.lastError || !response) {
          console.warn('Content script not available, attempting injection:', chrome.runtime.lastError?.message);
          
          // Try to inject content script
          const injectionResult = await this.injectContentScript(tabId);
          if (!injectionResult.success) {
            resolve({
              success: false,
              error: 'Content script not available. Please refresh the page to enable UI comparison features.',
            });
            return;
          }
          
          // Wait a bit for the content script to initialize
          setTimeout(() => {
            this.sendMessageToContentScript(tabId, message, resolve);
          }, 1000);
        } else {
          // Content script is available, send message directly
          this.sendMessageToContentScript(tabId, message, resolve);
        }
      });
    });
  }

  private sendMessageToContentScript(
    tabId: number, 
    message: Message, 
    resolve: (response: ExtensionResponse) => void
  ): void {
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
  }

  private async injectContentScript(tabId: number): Promise<ExtensionResponse> {
    try {
      // Get tab info to check if injection is possible
      const tab = await new Promise<chrome.tabs.Tab>((resolve) => {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            resolve(null as any);
          } else {
            resolve(tab);
          }
        });
      });

      if (!tab || !tab.url) {
        return {
          success: false,
          error: 'Unable to get tab information',
        };
      }

      // Check if URL allows content script injection
      if (tab.url.startsWith('chrome://') || 
          tab.url.startsWith('chrome-extension://') || 
          tab.url.startsWith('moz-extension://') || 
          tab.url.startsWith('about:')) {
        return {
          success: false,
          error: 'Cannot inject content script into browser internal pages',
        };
      }

      console.log('Attempting to inject content script into tab:', tabId);

      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });

      console.log('Content script injected successfully');
      return { success: true };

    } catch (error) {
      console.error('Failed to inject content script:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to inject content script',
      };
    }
  }

  private async handleConfigMessage(message: Message): Promise<ExtensionResponse> {
    try {
      const { type, payload } = message;
      
      switch (type) {
        case MESSAGE_TYPES.LOAD_CONFIG:
          // Load overlays for the specified URL
          const url = payload?.url;
          if (!url) {
            return {
              success: false,
              error: 'URL is required for loading config',
            };
          }

          // Get stored UI comparisons
          const result = await chrome.storage.local.get(['uiComparisons']);
          const uiComparisons = result.uiComparisons || {};
          const config = uiComparisons[url];
          
          return {
            success: true,
            data: config || { overlays: [] },
          };

        case MESSAGE_TYPES.SAVE_CONFIG:
          // Save overlays for the specified URL
          const saveUrl = payload?.url;
          const configData = payload?.config;
          
          if (!saveUrl || !configData) {
            return {
              success: false,
              error: 'URL and config data are required for saving config',
            };
          }

          const saveResult = await chrome.storage.local.get(['uiComparisons']);
          const saveComparisons = saveResult.uiComparisons || {};
          saveComparisons[saveUrl] = configData;
          
          await chrome.storage.local.set({ uiComparisons: saveComparisons });
          
          return {
            success: true,
            data: 'Config saved successfully',
          };

        default:
          return {
            success: false,
            error: `Unknown config message type: ${type}`,
          };
      }
    } catch (error) {
      console.error('Error handling config message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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