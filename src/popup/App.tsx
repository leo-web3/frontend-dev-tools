import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useEffect, useState } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { UIComparatorPanel } from "./components/UIComparatorPanel";
import { ViewportSimulator } from "./components/ViewportSimulator";
import { useExtensionStore } from "./hooks/useExtensionStore";
import { useViewportSimulator } from "./hooks/useViewportSimulator";
import { useI18n } from "./hooks/useI18n";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("ui-comparator");
  const {
    initializeStore,
    saveLastActiveTab,
    loadLastActiveTab,
    globalSettings,
    updateGlobalSettings,
  } = useExtensionStore();
  const { adjustViewport } = useViewportSimulator();
  const { t } = useI18n();

  useEffect(() => {
    // Initialize the store and get current tab info
    const initializeApp = async () => {
      await initializeStore();
      // Load the last active tab after store is initialized
      const lastTab = loadLastActiveTab();
      // Only allow valid tabs
      const validTabs = ["ui-comparator", "settings"];
      setActiveTab(validTabs.includes(lastTab) ? lastTab : "ui-comparator");
    };

    initializeApp();
  }, []);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    // Save the active tab to storage
    saveLastActiveTab(tabKey);
  };

  const toggleTheme = () => {
    const newTheme = globalSettings.theme === "light" ? "dark" : "light";
    updateGlobalSettings({ theme: newTheme });
    // Apply theme class to document root
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleLanguage = () => {
    const newLanguage = globalSettings.language === "zh" ? "en" : "zh";
    updateGlobalSettings({ language: newLanguage });
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", globalSettings.theme === "dark");
  }, [globalSettings.theme]);

  // Tab definitions for cleaner code
  const tabData = [
    {
      key: "ui-comparator",
      icon: "🎨",
      label: t('tabs.ui_comparator'),
      component: <UIComparatorPanel />,
    },
    {
      key: "settings",
      icon: "⚙️",
      label: t('tabs.settings'),
      component: <SettingsPanel />,
    },
  ];

  return (
    <div className="app-container h-screen bg-gradient-to-br from-background via-background to-muted/10 text-foreground flex flex-col overflow-hidden">
      {/* Dynamic Island Header */}
      <header className="flex-shrink-0 z-50 pt-3 pb-4 shadow-lg border-b border-border/10 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-10 w-10 p-0 rounded-full bg-muted/50 backdrop-blur-xl hover:bg-muted/70 transition-all duration-200 border border-border/30"
            title={globalSettings.theme === "light" ? t('app.theme.light') : t('app.theme.dark')}
          >
            <span className="text-foreground hover:scale-110 transition-transform duration-200">
              {globalSettings.theme === "light" ? "🌙" : "☀️"}
            </span>
          </Button>

          {/* Main Dynamic Island */}
          <div className="flex items-center gap-2 bg-foreground/90 backdrop-blur-xl rounded-full px-4 py-2 shadow-2xl border border-border/20 transition-all duration-300 hover:scale-105">
            <div className="w-5 h-5 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <div className="w-3 h-3 text-blue-400">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
                </svg>
              </div>
            </div>
            <span className="text-background font-medium text-sm whitespace-nowrap">
              Frontend Dev Tools
            </span>
          </div>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="h-10 w-10 p-0 rounded-full bg-muted/50 backdrop-blur-xl hover:bg-muted/70 transition-all duration-200 border border-border/30"
            title={globalSettings.language === "zh" ? t('app.language.switch_to_english') : t('app.language.switch_to_chinese')}
          >
            <span className="text-foreground hover:scale-110 transition-transform duration-200">
              {globalSettings.language === "zh" ? "🇺🇸" : "🇨🇳"}
            </span>
          </Button>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <main className="flex-1 overflow-y-auto px-4">
          {tabData.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="mt-0">
              {tab.component}
            </TabsContent>
          ))}
        </main>

        {/* iPhone-style Bottom Tab Bar */}
        <footer className="flex-shrink-0 bg-background/95 backdrop-blur-xl border-t border-border/30 shadow-lg">
          <TabsList className="grid grid-cols-2 w-full bg-transparent p-0 h-auto">
            {tabData.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex flex-col items-center gap-1 py-2 px-4 rounded-none bg-transparent data-[state=active]:bg-transparent hover:bg-transparent transition-all duration-200 data-[state=active]:text-primary"
              >
                <span className="text-2xl transition-transform duration-200 data-[state=active]:scale-110">
                  {tab.icon}
                </span>
                <span className="text-xs font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </footer>
      </Tabs>
    </div>
  );
};
