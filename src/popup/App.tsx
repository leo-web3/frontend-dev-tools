import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useEffect, useState } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { UIComparatorPanel } from "./components/UIComparatorPanel";
import { useExtensionStore } from "./hooks/useExtensionStore";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("ui-comparator");
  const {
    initializeStore,
    saveLastActiveTab,
    loadLastActiveTab,
    globalSettings,
    updateGlobalSettings,
  } = useExtensionStore();

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
      label: "UI比对",
      component: <UIComparatorPanel />,
    },
    {
      key: "settings",
      icon: "⚙️",
      label: "设置",
      component: <SettingsPanel />,
    },
  ];

  return (
    <div className="app-container min-h-screen bg-background text-foreground">
      <header className="relative z-50 bg-background border-b h-16">
        <div className="flex fixed top-0 left-0 right-0 bg-background border-b w-full h-16 items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <h1 className="text-lg font-semibold">Frontend Dev Tools</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0"
              title={globalSettings.theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
            >
              {globalSettings.theme === "light" ? "🌙" : "☀️"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="h-8 w-8 p-0"
              title={globalSettings.language === "zh" ? "Switch to English" : "切换到中文"}
            >
              {globalSettings.language === "zh" ? "🇺🇸" : "🇨🇳"}
            </Button>
          </div>
        </div>
      </header>

      <main className="app-content p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-6">
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
        <div className="text-center text-sm text-muted-foreground">© 2024 Frontend Dev Tools</div>
      </footer>
    </div>
  );
};
