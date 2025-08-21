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
import { useI18n } from "../hooks/useI18n";

export const SettingsPanel: React.FC = () => {
  const { globalSettings, loading, error, loadGlobalSettings, updateGlobalSettings } =
    useExtensionStore();
  const { t } = useI18n();

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
      showToast(t("toast.theme_saved"), "success");
    } catch (error) {
      showToast(t("toast.theme_failed"), "error");
    }
  };

  const handleLanguageChange = async (language: "zh" | "en") => {
    try {
      await updateGlobalSettings({ language });
      showToast(t("toast.language_saved"), "success");
    } catch (error) {
      showToast(t("toast.language_failed"), "error");
    }
  };

  const handleShortcutChange = async (action: string, shortcut: string) => {
    try {
      const shortcuts = { ...globalSettings.shortcuts, [action]: shortcut };
      await updateGlobalSettings({ shortcuts });
      showToast(t("toast.shortcut_saved"), "success");
    } catch (error) {
      showToast(t("toast.shortcut_failed"), "error");
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

      showToast(t("toast.config_exported"), "success");
    } catch (error) {
      showToast(t("toast.config_export_failed"), "error");
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
        showToast(t("toast.config_imported"), "success");
      } catch (error) {
        showToast(t("toast.config_import_failed"), "error");
      }
    };
    reader.readAsText(file);
  };

  const handleResetSettings = async () => {
    try {
      await storageManager.clear();
      showToast(t("toast.settings_reset"), "success");
      setResetDialogOpen(false);
    } catch (error) {
      showToast(t("toast.settings_reset_failed"), "error");
    }
  };

  const getStorageUsage = async () => {
    try {
      const usage = await storageManager.getUsage();
      const usagePercent = ((usage.bytesInUse / usage.quotaBytes) * 100).toFixed(1);
      showToast(
        `${t("toast.storage_info")}: ${usage.bytesInUse} / ${usage.quotaBytes} bytes (${usagePercent}%)`,
        "info"
      );
    } catch (error) {
      showToast(t("toast.storage_info_failed"), "error");
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
          <h4 className="font-medium mb-4">{t("settings.shortcuts")}</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{t("settings.toggle_ui_comparison")}</div>
              <Input
                value={globalSettings.shortcuts.toggleUIComparator}
                onChange={(e) => handleShortcutChange("toggleUIComparator", e.target.value)}
                placeholder={t("settings.shortcut_placeholder")}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-4">{t("settings.data_management")}</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{t("settings.export_config")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("settings.export_config_desc")}
                </div>
              </div>
              <Button onClick={handleExportConfig} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                {t("settings.export")}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{t("settings.import_config")}</div>
                <div className="text-sm text-muted-foreground">{t("settings.import_config_desc")}</div>
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
                  {t("settings.import")}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{t("settings.storage_usage")}</div>
                <div className="text-sm text-muted-foreground">{t("settings.storage_usage_desc")}</div>
              </div>
              <Button onClick={getStorageUsage} variant="outline" size="sm">
                <Info className="w-4 h-4 mr-1" />
                {t("settings.view")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardContent className="p-4">
          <h4 className="font-medium mb-4 text-destructive">{t("settings.danger_zone")}</h4>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{t("settings.reset_settings")}</div>
              <div className="text-sm text-destructive">
                {t("settings.reset_settings_desc")}
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setResetDialogOpen(true)}>
              <RotateCcw className="w-4 h-4 mr-1" />
              {t("settings.reset")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-4">{t("settings.about")}</h4>
          <div className="space-y-2 text-sm">
            <div className="font-medium">Frontend Dev Tools</div>
            <div className="text-muted-foreground">{t("settings.version")}: 1.0.0</div>
            <div className="text-muted-foreground">{t("settings.description")}</div>
            <div className="mt-4">
              <div className="font-medium mb-2">{t("settings.features")}</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>{t("settings.feature_ui_compare")}</li>
                <li>{t("settings.feature_browser_size")}</li>
                <li>{t("settings.feature_layer_management")}</li>
                <li>{t("settings.feature_responsive")}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset confirmation dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.reset_confirm_title")}</DialogTitle>
            <DialogDescription>
              {t("settings.reset_confirm_desc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleResetSettings}>
              {t("settings.reset_confirm_title")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
