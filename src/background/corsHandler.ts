import { CorsConfig, ExtensionResponse } from '@/shared/types';
import { storageManager } from '@/shared/storage';
import { STORAGE_KEYS, DEFAULT_CORS_CONFIG, CORS_HEADERS } from '@/shared/constants';

export class CorsHandler {
  private isEnabled = false;
  private config: CorsConfig = DEFAULT_CORS_CONFIG;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.config = await storageManager.get(STORAGE_KEYS.CORS_SETTINGS);
      this.isEnabled = this.config.enabled;
      
      if (this.isEnabled) {
        this.enableCorsInterception();
      }
    } catch (error) {
      console.error('Failed to initialize CORS handler:', error);
    }
  }

  async toggleCors(enabled: boolean): Promise<ExtensionResponse> {
    try {
      if (enabled === this.isEnabled) {
        return { 
          success: true, 
          data: `CORS is already ${enabled ? 'enabled' : 'disabled'}` 
        };
      }

      this.isEnabled = enabled;
      this.config.enabled = enabled;

      // Save to storage
      await storageManager.set(STORAGE_KEYS.CORS_SETTINGS, this.config);

      if (enabled) {
        this.enableCorsInterception();
      } else {
        this.disableCorsInterception();
      }

      // Notify all tabs about the change
      this.notifyTabsOfChange();

      return { 
        success: true, 
        data: `CORS ${enabled ? 'enabled' : 'disabled'}` 
      };
    } catch (error) {
      console.error('Failed to toggle CORS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CORS toggle failed',
      };
    }
  }

  async updateConfig(newConfig: Partial<CorsConfig>): Promise<ExtensionResponse> {
    try {
      this.config = { ...this.config, ...newConfig };
      await storageManager.set(STORAGE_KEYS.CORS_SETTINGS, this.config);

      // If CORS is enabled, restart the interception with new config
      if (this.isEnabled) {
        this.disableCorsInterception();
        this.enableCorsInterception();
      }

      return { 
        success: true, 
        data: 'CORS configuration updated' 
      };
    } catch (error) {
      console.error('Failed to update CORS config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Config update failed',
      };
    }
  }

  async getStatus(): Promise<boolean> {
    return this.isEnabled;
  }

  async getConfig(): Promise<CorsConfig> {
    return this.config;
  }

  private enableCorsInterception(): void {
    // TODO: Implement MV3-compatible CORS handling using declarativeNetRequest
    // For now, CORS functionality is disabled to allow the extension to load
    console.log('[CORS Handler] CORS interception temporarily disabled - requires MV3 migration');
  }

  private disableCorsInterception(): void {
    // TODO: Remove declarativeNetRequest rules when MV3 CORS is implemented
    console.log('[CORS Handler] CORS interception disabled');
  }

  private onBeforeSendHeaders(
    details: chrome.webRequest.WebRequestHeadersDetails
  ): chrome.webRequest.BlockingResponse | void {
    if (!this.isEnabled) return;

    const headers = details.requestHeaders || [];

    // Add Origin header if not present (for preflight requests)
    const hasOrigin = headers.some(header => 
      header.name.toLowerCase() === 'origin'
    );

    if (!hasOrigin && details.initiator) {
      headers.push({
        name: 'Origin',
        value: details.initiator,
      });
    }

    return { requestHeaders: headers };
  }

  private onHeadersReceived(
    details: chrome.webRequest.WebResponseHeadersDetails
  ): chrome.webRequest.BlockingResponse | void {
    if (!this.isEnabled) return;

    const headers = details.responseHeaders || [];
    
    // Remove existing CORS headers
    const filteredHeaders = headers.filter(header => {
      const headerName = header.name.toLowerCase();
      return !Object.values(CORS_HEADERS).some(corsHeader => 
        corsHeader.toLowerCase() === headerName
      );
    });

    // Add new CORS headers based on config
    const corsHeaders = this.generateCorsHeaders(details.initiator);
    filteredHeaders.push(...corsHeaders);

    return { responseHeaders: filteredHeaders };
  }

  private generateCorsHeaders(initiator?: string): chrome.webRequest.HttpHeader[] {
    const headers: chrome.webRequest.HttpHeader[] = [];

    // Access-Control-Allow-Origin
    const allowedOrigin = this.getAllowedOrigin(initiator);
    headers.push({
      name: CORS_HEADERS.ACCESS_CONTROL_ALLOW_ORIGIN,
      value: allowedOrigin,
    });

    // Access-Control-Allow-Methods
    headers.push({
      name: CORS_HEADERS.ACCESS_CONTROL_ALLOW_METHODS,
      value: this.config.allowedMethods.join(', '),
    });

    // Access-Control-Allow-Headers
    headers.push({
      name: CORS_HEADERS.ACCESS_CONTROL_ALLOW_HEADERS,
      value: this.config.allowedHeaders.join(', '),
    });

    // Access-Control-Allow-Credentials
    if (this.config.credentials) {
      headers.push({
        name: CORS_HEADERS.ACCESS_CONTROL_ALLOW_CREDENTIALS,
        value: 'true',
      });
    }

    // Access-Control-Max-Age
    headers.push({
      name: CORS_HEADERS.ACCESS_CONTROL_MAX_AGE,
      value: '86400', // 24 hours
    });

    return headers;
  }

  private getAllowedOrigin(initiator?: string): string {
    if (this.config.allowedOrigins.includes('*')) {
      return '*';
    }

    if (initiator && this.config.allowedOrigins.includes(initiator)) {
      return initiator;
    }

    if (this.config.allowedOrigins.length > 0) {
      return this.config.allowedOrigins[0];
    }

    return '*';
  }

  private notifyTabsOfChange(): void {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'CORS_STATUS_CHANGED',
            payload: { enabled: this.isEnabled },
          }, () => {
            // Ignore errors for tabs that don't have content script
            if (chrome.runtime.lastError) {
              // Silent ignore
            }
          });
        }
      });
    });
  }
}

// Handle installation and updates
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize CORS settings if they don't exist
  try {
    await storageManager.get(STORAGE_KEYS.CORS_SETTINGS);
  } catch {
    await storageManager.set(STORAGE_KEYS.CORS_SETTINGS, DEFAULT_CORS_CONFIG);
  }
});