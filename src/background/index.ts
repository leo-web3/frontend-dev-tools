import { Message, ExtensionResponse, MessageType } from '@/shared/types';
import { MESSAGE_TYPES } from '@/shared/constants';
import { EnvironmentManager } from './environmentManager';
import { CorsHandler } from './corsHandler';

class BackgroundService {
  private static instance: BackgroundService;
  private environmentManager: EnvironmentManager;
  private corsHandler: CorsHandler;
  
  static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  constructor() {
    this.environmentManager = new EnvironmentManager();
    this.corsHandler = new CorsHandler();
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
        case MESSAGE_TYPES.INJECT_ENVIRONMENT:
          return await this.environmentManager.injectEnvironmentVariables(
            targetTabId!, 
            payload
          );

        case MESSAGE_TYPES.CORS_STATUS_CHANGED:
          return await this.corsHandler.toggleCors(payload.enabled);

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
    height: number
  ): Promise<ExtensionResponse> {
    try {
      console.log('Adjusting browser size to viewport:', { width, height });
      
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
          
          // First get viewport dimensions from the content script
          chrome.tabs.sendMessage(tab.id!, {
            type: 'GET_VIEWPORT_DIMENSIONS'
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Failed to get viewport dimensions:', chrome.runtime.lastError);
              resolve({
                success: false,
                error: 'Failed to get viewport dimensions from page',
              });
              return;
            }

            const { innerWidth, innerHeight } = response.data || {};
            
            chrome.windows.getCurrent((currentWindow) => {
              if (chrome.runtime.lastError) {
                console.error('Error getting current window:', chrome.runtime.lastError);
                resolve({
                  success: false,
                  error: `Failed to get current window: ${chrome.runtime.lastError.message}`,
                });
                return;
              }

              console.log('Current window:', currentWindow);
              console.log('Current viewport:', { innerWidth, innerHeight });
              
              if (currentWindow?.id && currentWindow.width && currentWindow.height && innerWidth && innerHeight) {
                // Calculate the difference between window size and viewport size
                const widthDiff = currentWindow.width - innerWidth;
                const heightDiff = currentWindow.height - innerHeight;
                
                // Calculate new window size to achieve desired viewport size
                const newWindowWidth = width + widthDiff;
                const newWindowHeight = height + heightDiff;
                
                console.log('Calculated adjustments:', { 
                  widthDiff, 
                  heightDiff, 
                  newWindowWidth, 
                  newWindowHeight 
                });

                chrome.windows.update(currentWindow.id, {
                  width: newWindowWidth,
                  height: newWindowHeight,
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
                        viewportHeight: height,
                        widthDiff,
                        heightDiff,
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

        chrome.contextMenus.create({
          id: 'toggle-cors',
          parentId: 'fe-dev-tools-main',
          title: 'Toggle CORS',
          contexts: ['page'],
        });

        chrome.contextMenus.create({
          id: 'inject-env',
          parentId: 'fe-dev-tools-main',
          title: 'Inject Environment Variables',
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

          switch (info.menuItemId) {
            case 'toggle-cors':
              const corsStatus = await this.corsHandler.getStatus();
              await this.corsHandler.toggleCors(!corsStatus);
              break;

            case 'inject-env':
              // Get current domain's environment variables and inject them
              const domain = new URL(tab.url!).hostname;
              await this.environmentManager.injectForDomain(tab.id, domain);
              break;
          }
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
        try {
          if (changeInfo.status === 'complete' && tab.url) {
            await this.environmentManager.autoInjectForTab(tabId, tab.url);
          }
        } catch (error) {
          console.error('Error handling tab update:', error);
        }
      });
    } else {
      console.warn('chrome.tabs.onUpdated is not available');
    }

    // Add safety check for tab creation listener
    if (chrome.tabs && chrome.tabs.onCreated) {
      chrome.tabs.onCreated.addListener(async (tab) => {
        try {
          if (tab.url && tab.id) {
            await this.environmentManager.autoInjectForTab(tab.id, tab.url);
          }
        } catch (error) {
          console.error('Error handling tab creation:', error);
        }
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