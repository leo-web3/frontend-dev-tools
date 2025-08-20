import { 
  EnvironmentVariable, 
  EnvironmentConfig, 
  ExtensionResponse 
} from '@/shared/types';
import { storageManager } from '@/shared/storage';
import { STORAGE_KEYS, DEFAULT_ENVIRONMENT_CONFIG } from '@/shared/constants';
import { getDomainFromUrl, createExtensionError } from '@/shared/utils';

export class EnvironmentManager {
  async injectEnvironmentVariables(
    tabId: number, 
    variables: EnvironmentVariable[]
  ): Promise<ExtensionResponse> {
    try {
      // Filter only enabled variables
      const enabledVariables = variables.filter(v => v.enabled);
      
      if (enabledVariables.length === 0) {
        return { success: true, data: 'No enabled variables to inject' };
      }

      // Inject variables into the page
      await chrome.scripting.executeScript({
        target: { tabId },
        func: this.injectVariablesScript,
        args: [enabledVariables],
      });

      return { 
        success: true, 
        data: `Injected ${enabledVariables.length} environment variables` 
      };
    } catch (error) {
      console.error('Failed to inject environment variables:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Injection failed',
      };
    }
  }

  async injectForDomain(tabId: number, domain: string): Promise<ExtensionResponse> {
    try {
      const environments = await storageManager.get(STORAGE_KEYS.ENVIRONMENTS);
      const domainConfig = environments[domain] || DEFAULT_ENVIRONMENT_CONFIG;

      if (!domainConfig.globalEnabled) {
        return { 
          success: false, 
          error: 'Environment variables are disabled for this domain' 
        };
      }

      return await this.injectEnvironmentVariables(tabId, domainConfig.variables);
    } catch (error) {
      console.error('Failed to inject variables for domain:', domain, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Domain injection failed',
      };
    }
  }

  async saveEnvironmentConfig(
    domain: string, 
    config: EnvironmentConfig
  ): Promise<ExtensionResponse> {
    try {
      const environments = await storageManager.get(STORAGE_KEYS.ENVIRONMENTS);
      environments[domain] = config;
      await storageManager.set(STORAGE_KEYS.ENVIRONMENTS, environments);

      return { 
        success: true, 
        data: 'Environment configuration saved' 
      };
    } catch (error) {
      console.error('Failed to save environment config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Save failed',
      };
    }
  }

  async getEnvironmentConfig(domain: string): Promise<EnvironmentConfig> {
    try {
      const environments = await storageManager.get(STORAGE_KEYS.ENVIRONMENTS);
      return environments[domain] || DEFAULT_ENVIRONMENT_CONFIG;
    } catch (error) {
      console.error('Failed to get environment config:', error);
      return DEFAULT_ENVIRONMENT_CONFIG;
    }
  }

  async addEnvironmentVariable(
    domain: string, 
    variable: EnvironmentVariable
  ): Promise<ExtensionResponse> {
    try {
      const config = await this.getEnvironmentConfig(domain);
      
      // Check if variable already exists
      const existingIndex = config.variables.findIndex(v => v.key === variable.key);
      
      if (existingIndex >= 0) {
        // Update existing variable
        config.variables[existingIndex] = variable;
      } else {
        // Add new variable
        config.variables.push(variable);
      }

      return await this.saveEnvironmentConfig(domain, config);
    } catch (error) {
      console.error('Failed to add environment variable:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Add failed',
      };
    }
  }

  async removeEnvironmentVariable(
    domain: string, 
    key: string
  ): Promise<ExtensionResponse> {
    try {
      const config = await this.getEnvironmentConfig(domain);
      config.variables = config.variables.filter(v => v.key !== key);
      
      return await this.saveEnvironmentConfig(domain, config);
    } catch (error) {
      console.error('Failed to remove environment variable:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Remove failed',
      };
    }
  }

  async toggleEnvironmentVariable(
    domain: string, 
    key: string
  ): Promise<ExtensionResponse> {
    try {
      const config = await this.getEnvironmentConfig(domain);
      const variable = config.variables.find(v => v.key === key);
      
      if (variable) {
        variable.enabled = !variable.enabled;
        return await this.saveEnvironmentConfig(domain, config);
      } else {
        return {
          success: false,
          error: 'Environment variable not found',
        };
      }
    } catch (error) {
      console.error('Failed to toggle environment variable:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Toggle failed',
      };
    }
  }

  async toggleGlobalEnvironment(
    domain: string, 
    enabled: boolean
  ): Promise<ExtensionResponse> {
    try {
      const config = await this.getEnvironmentConfig(domain);
      config.globalEnabled = enabled;
      
      return await this.saveEnvironmentConfig(domain, config);
    } catch (error) {
      console.error('Failed to toggle global environment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Toggle failed',
      };
    }
  }

  async autoInjectForTab(tabId: number, url: string): Promise<void> {
    try {
      const domain = getDomainFromUrl(url);
      const config = await this.getEnvironmentConfig(domain);

      if (config.globalEnabled && config.autoInject) {
        await this.injectEnvironmentVariables(tabId, config.variables);
      }
    } catch (error) {
      console.error('Failed to auto-inject for tab:', error);
    }
  }

  // Script function that runs in the page context
  private injectVariablesScript(variables: EnvironmentVariable[]): void {
    // Create or update the environment object on window
    if (!window.env) {
      window.env = {};
    }

    // Inject all variables
    variables.forEach(variable => {
      window.env[variable.key] = variable.value;
      
      // Also set as process.env for Node.js compatibility
      if (!window.process) {
        window.process = { env: {} };
      }
      window.process.env[variable.key] = variable.value;
    });

    // Dispatch custom event to notify page about injection
    window.dispatchEvent(new CustomEvent('fe-dev-tools-env-injected', {
      detail: {
        variables: variables.map(v => ({ key: v.key, value: v.value })),
        timestamp: Date.now(),
      }
    }));

    console.log(`[FE Dev Tools] Injected ${variables.length} environment variables:`, 
      variables.map(v => v.key));
  }
}

// Tab event listeners are now handled in BackgroundService class