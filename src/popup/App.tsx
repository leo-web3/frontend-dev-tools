import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { EnvironmentPanel } from './components/EnvironmentPanel';
import { CorsPanel } from './components/CorsPanel';
import { UIComparatorPanel } from './components/UIComparatorPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { useExtensionStore } from './hooks/useExtensionStore';

const { TabPane } = Tabs;

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

  const tabItems: TabsProps['items'] = [
    {
      key: 'environment',
      label: (
        <span>
          <span className="tab-icon">🌍</span>
          环境变量
        </span>
      ),
      children: <EnvironmentPanel currentDomain={currentDomain} />,
    },
    {
      key: 'cors',
      label: (
        <span>
          <span className="tab-icon">🔗</span>
          跨域处理
        </span>
      ),
      children: <CorsPanel />,
    },
    {
      key: 'ui-comparator',
      label: (
        <span>
          <span className="tab-icon">🎨</span>
          UI比对
        </span>
      ),
      children: <UIComparatorPanel />,
    },
    {
      key: 'settings',
      label: (
        <span>
          <span className="tab-icon">⚙️</span>
          设置
        </span>
      ),
      children: <SettingsPanel />,
    },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <span className="app-icon">🔧</span>
          Frontend Dev Tools
        </div>
        {currentDomain && (
          <div className="current-domain">
            <span className="domain-icon">📍</span>
            {currentDomain}
          </div>
        )}
      </header>

      <main className="app-content">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          size="small"
          items={tabItems}
          className="main-tabs"
        />
      </main>

      <footer className="app-footer">
        <div className="footer-text">
          © 2024 Frontend Dev Tools
        </div>
      </footer>
    </div>
  );
};