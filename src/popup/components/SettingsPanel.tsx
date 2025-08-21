import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { storageManager } from "@/shared/storage";
import { Download, Info, RotateCcw, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useExtensionStore } from "../hooks/useExtensionStore";

export const SettingsPanel: React.FC = () => {
  const { globalSettings, loading, error, loadGlobalSettings, updateGlobalSettings } =
    useExtensionStore();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadGlobalSettings();
  }, [loadGlobalSettings]);

  const handleThemeChange = async (theme: "light" | "dark") => {
    try {
      await updateGlobalSettings({ theme });
      showToast("主题设置已保存", "success");
    } catch (error) {
      showToast("主题设置失败", "error");
    }
  };

  const handleLanguageChange = async (language: "zh" | "en") => {
    try {
      await updateGlobalSettings({ language });
      showToast("语言设置已保存", "success");
    } catch (error) {
      showToast("语言设置失败", "error");
    }
  };

  const handleShortcutChange = async (action: string, shortcut: string) => {
    try {
      const shortcuts = { ...globalSettings.shortcuts, [action]: shortcut };
      await updateGlobalSettings({ shortcuts });
      showToast("快捷键设置已保存", "success");
    } catch (error) {
      showToast("快捷键设置失败", "error");
    }
  };

  const handleExportConfig = async () => {
    try {
      const data = await storageManager.exportData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `fe-dev-tools-config-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("配置导出成功", "success");
    } catch (error) {
      showToast("配置导出失败", "error");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await storageManager.importData(content);
        showToast("配置导入成功，请刷新扩展", "success");
      } catch (error) {
        showToast("配置导入失败：数据格式错误", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleResetSettings = async () => {
    try {
      await storageManager.clear();
      showToast("设置已重置，请刷新扩展", "success");
      setResetDialogOpen(false);
    } catch (error) {
      showToast("设置重置失败", "error");
    }
  };

  const getStorageUsage = async () => {
    try {
      const usage = await storageManager.getUsage();
      const usagePercent = ((usage.bytesInUse / usage.quotaBytes) * 100).toFixed(1);
      showToast(
        `存储使用情况: ${usage.bytesInUse} / ${usage.quotaBytes} bytes (${usagePercent}%)`,
        "info"
      );
    } catch (error) {
      showToast("获取存储信息失败", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/15 text-destructive rounded-md text-sm">{error}</div>
      )}
      {/* Keyboard Shortcuts */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-4">快捷键设置</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">切换UI比对</div>
              <Input
                value={globalSettings.shortcuts.toggleUIComparator}
                onChange={(e) => handleShortcutChange("toggleUIComparator", e.target.value)}
                placeholder="例如: Ctrl+Shift+U"
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-4">数据管理</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">导出配置</div>
                <div className="text-sm text-muted-foreground">
                  导出当前所有设置和配置到JSON文件
                </div>
              </div>
              <Button onClick={handleExportConfig} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">导入配置</div>
                <div className="text-sm text-muted-foreground">从JSON文件导入设置和配置</div>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  导入
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">存储使用情况</div>
                <div className="text-sm text-muted-foreground">查看扩展程序的存储使用情况</div>
              </div>
              <Button onClick={getStorageUsage} variant="outline" size="sm">
                <Info className="w-4 h-4 mr-1" />
                查看
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardContent className="p-4">
          <h4 className="font-medium mb-4 text-destructive">危险操作</h4>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">重置所有设置</div>
              <div className="text-sm text-destructive">
                这将清除所有配置数据，包括UI图层和扩展设置
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setResetDialogOpen(true)}>
              <RotateCcw className="w-4 h-4 mr-1" />
              重置设置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-4">关于</h4>
          <div className="space-y-2 text-sm">
            <div className="font-medium">Frontend Dev Tools</div>
            <div className="text-muted-foreground">版本: 1.0.0</div>
            <div className="text-muted-foreground">专为前端开发者设计的Chrome扩展工具</div>
            <div className="mt-4">
              <div className="font-medium mb-2">功能特性：</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>UI设计稿像素级比对</li>
                <li>浏览器尺寸快速调整</li>
                <li>图层管理和控制</li>
                <li>响应式设计辅助</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset confirmation dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认重置</DialogTitle>
            <DialogDescription>
              这将清除所有配置数据，包括UI图层和扩展设置。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleResetSettings}>
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
