import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnvironmentPanel } from './components/EnvironmentPanel';
import { CorsPanel } from './components/CorsPanel';
import { UIComparatorPanel } from './components/UIComparatorPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { useExtensionStore } from './hooks/useExtensionStore';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('environment');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const { initializeStore, saveLastActiveTab, loadLastActiveTab } = useExtensionStore();

  useEffect(() => {
    // Initialize the store and get current tab info
    const initializeApp = async () => {
      await initializeStore();
      // Load the last active tab after store is initialized
      const lastTab = loadLastActiveTab();
      setActiveTab(lastTab);
      getCurrentTabInfo();
    };
    
    initializeApp();
  }, []);

  const getCurrentTabInfo = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CURRENT_TAB'
      });

      if (response.success && response.data.url) {
        const url = new URL(response.data.url);
        setCurrentDomain(url.hostname);
      }
    } catch (error) {
      console.error('Failed to get current tab info:', error);
    }
  };

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    // Save the active tab to storage
    saveLastActiveTab(tabKey);
  };

  // Tab definitions for cleaner code
  const tabData = [
    {
      key: 'environment',
      icon: '🌍',
      label: '环境变量',
      component: <EnvironmentPanel currentDomain={currentDomain} />,
    },
    {
      key: 'cors',
      icon: '🔗',
      label: '跨域处理',
      component: <CorsPanel />,
    },
    {
      key: 'ui-comparator',
      icon: '🎨',
      label: 'UI比对',
      component: <UIComparatorPanel />,
    },
    {
      key: 'settings',
      icon: '⚙️',
      label: '设置',
      component: <SettingsPanel />,
    },
  ];

  return (
    <div className="app-container min-h-screen bg-background text-foreground">
      <header className="app-header border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <h1 className="text-lg font-semibold">Frontend Dev Tools</h1>
          </div>
          {currentDomain && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>📍</span>
              <span>{currentDomain}</span>
            </div>
          )}
        </div>
      </header>

      <main className="app-content p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-6">
            {tabData.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tabData.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="mt-0">
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <footer className="app-footer border-t px-6 py-3">
        <div className="text-center text-sm text-muted-foreground">
          © 2024 Frontend Dev Tools
        </div>
      </footer>
    </div>
  );
};