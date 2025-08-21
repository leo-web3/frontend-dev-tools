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
import { Slider } from "@/components/ui/slider";
import { UI_CONSTANTS } from "@/shared/constants";
import { UIOverlay } from "@/shared/types";
import { generateId, readFileAsDataURL, validateImageFile } from "@/shared/utils";
import { Eye, EyeOff, Lock, Monitor, Trash2, Unlock, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useExtensionStore } from "../hooks/useExtensionStore";
import { useI18n } from "../hooks/useI18n";

export const UIComparatorPanel: React.FC = () => {
  const {
    currentOverlays,
    loading,
    error,
    loadOverlays,
    createOverlay,
    updateOverlay,
    removeOverlay,
  } = useExtensionStore();
  const { t } = useI18n();

  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [overlayToDelete, setOverlayToDelete] = useState<string>("");
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    getCurrentUrl();
  }, []);

  useEffect(() => {
    if (currentUrl) {
      loadOverlays(currentUrl);
    }
  }, [currentUrl, loadOverlays]);

  const getCurrentUrl = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url) {
        setCurrentUrl(tab.url);
      }
    } catch (error) {
      console.error("Failed to get current URL:", error);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const errors = validateImageFile(file);
      if (errors.length > 0) {
        showToast(errors[0], "error");
        return false;
      }

      const imageUrl = await readFileAsDataURL(file);

      // Get image natural dimensions
      const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
          };
          img.onerror = reject;
          img.src = src;
        });
      };

      const { width, height } = await getImageDimensions(imageUrl);

      // Clear all existing overlays before creating new one
      if (currentOverlays.length > 0) {
        console.log("Clearing existing overlays before upload:", currentOverlays.length);
        for (const existingOverlay of currentOverlays) {
          await removeOverlay(existingOverlay.id);
        }
        // Wait a moment to ensure clearing is complete
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const overlay: UIOverlay = {
        id: generateId(),
        imageUrl,
        position: { x: 0, y: 0 },
        size: { width, height }, // Use actual image dimensions
        opacity: 0.7,
        visible: true,
        locked: false,
      };

      // Auto-adjust browser size to match design width only
      await handleAdjustBrowserSize(width, null);

      console.log("Creating new overlay after clearing:", overlay);
      await createOverlay(overlay);
      showToast(`${t('ui_comparator.upload.success')} ${width}px`, "success");
      return false; // Prevent default upload behavior
    } catch (error) {
      console.error("Upload error:", error);
      showToast(t('ui_comparator.upload.error'), "error");
      return false;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleOpacityChange = async (overlayId: string, opacity: number) => {
    try {
      await updateOverlay(overlayId, { opacity: opacity / 100 });
    } catch (error) {
      showToast(t('toast.operation_failed'), "error");
    }
  };

  const handleToggleVisibility = async (overlayId: string, visible: boolean) => {
    try {
      await updateOverlay(overlayId, { visible: !visible });
      showToast(!visible ? t('toast.layer_toggled_visible') : t('toast.layer_toggled_hidden'), "success");
    } catch (error) {
      showToast(t('toast.operation_failed'), "error");
    }
  };

  const handleToggleLock = async (overlayId: string, locked: boolean) => {
    try {
      await updateOverlay(overlayId, { locked: !locked });
      showToast(!locked ? t('toast.layer_locked') : t('toast.layer_unlocked'), "success");
    } catch (error) {
      showToast(t('toast.operation_failed'), "error");
    }
  };

  const handleRemoveOverlay = async (overlayId: string) => {
    try {
      await removeOverlay(overlayId);
      showToast(t('toast.layer_deleted'), "success");
      setDeleteDialogOpen(false);
      setOverlayToDelete("");
    } catch (error) {
      showToast(t('toast.operation_failed'), "error");
    }
  };

  const handleAdjustBrowserSize = async (width: number, height: number | null) => {
    try {
      console.log("Requesting browser size adjustment:", { width, height });

      const response = await chrome.runtime.sendMessage({
        type: "ADJUST_BROWSER_SIZE",
        payload: { width, height },
      });

      console.log("Browser size adjustment response:", response);

      if (response?.success) {
        const data = response.data;
        const finalMessage = data?.screenConstrained
          ? `浏览器宽度已调整为 ${data.finalWidth}px (受屏幕尺寸限制)`
          : height !== null
          ? `浏览器尺寸已调整为 ${width}x${height}`
          : `浏览器宽度已调整为 ${width}px`;
        showToast(finalMessage, "success");
      } else {
        const errorMsg = response?.error || "尺寸调整失败";
        console.error("Browser size adjustment failed:", errorMsg);
        showToast(errorMsg, "error");
      }
    } catch (error) {
      console.error("Browser size adjustment error:", error);
      showToast("尺寸调整失败", "error");
    }
  };

  const handleToggleAllOverlays = async () => {
    try {
      const visibleCount = currentOverlays.filter((o) => o.visible).length;
      const shouldHide = visibleCount > 0;

      for (const overlay of currentOverlays) {
        await updateOverlay(overlay.id, { visible: !shouldHide });
      }

      showToast(shouldHide ? t('toast.all_layers_hidden') : t('toast.all_layers_visible'), "success");
    } catch (error) {
      showToast(t('toast.operation_failed'), "error");
    }
  };

  const handleClearAllOverlays = async () => {
    try {
      for (const overlay of currentOverlays) {
        await removeOverlay(overlay.id);
      }
      showToast(t('toast.layers_cleared'), "success");
      setClearAllDialogOpen(false);
    } catch (error) {
      showToast(t('toast.operation_failed'), "error");
    }
  };

  if (!currentUrl) {
    return (
      <div className="p-4 text-center">
        <div className="text-muted-foreground">无法获取当前页面信息</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            toast.type === "success" 
              ? "bg-green-500/90 text-white border-green-400/50" 
              : "bg-red-500/90 text-white border-red-400/50"
          } transition-all duration-300 transform translate-x-0`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              toast.type === "success" ? "bg-white/80" : "bg-white/80"
            }`}></div>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 text-red-600 rounded-2xl text-sm border border-red-200/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 border-2 border-red-500 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              </div>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Upload section */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/50 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="relative border-2 border-dashed border-border/30 rounded-2xl p-8 text-center hover:border-border/60 transition-all duration-300 hover:bg-muted/20 group">
            <input
              type="file"
              accept={UI_CONSTANTS.SUPPORTED_IMAGE_FORMATS.map((f) => `.${f}`).join(",")}
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold mb-2 text-foreground">{t('ui_comparator.upload.title')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              支持格式：{UI_CONSTANTS.SUPPORTED_IMAGE_FORMATS.join("、")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Browser size adjustment */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/50 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="font-semibold text-foreground">{t('ui_comparator.browser_size.title')}</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {UI_CONSTANTS.COMMON_SCREEN_SIZES.map(({ name, width, height }) => (
              <Button
                key={name}
                variant="ghost"
                size="sm"
                onClick={() => handleAdjustBrowserSize(width, height)}
                className="h-auto p-3 flex flex-col gap-1.5 border border-border/50 rounded-xl hover:border-border hover:bg-muted/50 transition-all duration-200 hover:scale-105"
              >
                <span className="text-xs font-medium text-foreground">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {width} × {height}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overlays management */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/50 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                <div className="w-4 h-4 flex flex-col gap-0.5">
                  <div className="h-0.5 bg-green-600 rounded-full opacity-40"></div>
                  <div className="h-0.5 bg-green-600 rounded-full opacity-60"></div>
                  <div className="h-0.5 bg-green-600 rounded-full opacity-80"></div>
                  <div className="h-0.5 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <h4 className="font-semibold text-foreground">{t('ui_comparator.layers.title')}</h4>
              <div className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {currentOverlays.length}
              </div>
            </div>
            {currentOverlays.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleToggleAllOverlays}
                  className="rounded-xl border border-border/50 hover:border-border hover:bg-muted/50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('ui_comparator.layers.toggle_all')}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setClearAllDialogOpen(true)}
                  className="rounded-xl border border-red-200/50 hover:border-red-300 hover:bg-red-50/50 text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('ui_comparator.layers.clear_all')}
                </Button>
              </div>
            )}
          </div>

          {currentOverlays.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">暂无UI图层</div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentOverlays.map((overlay) => (
                <OverlayItem
                  key={overlay.id}
                  overlay={overlay}
                  onOpacityChange={handleOpacityChange}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleLock={handleToggleLock}
                  onRemove={(id) => {
                    setOverlayToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyboard shortcuts info */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/50 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-purple-600 rounded opacity-80"></div>
            </div>
            <h4 className="font-semibold text-foreground">{t('ui_comparator.shortcuts.title')}</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
              <span className="text-sm text-muted-foreground">{t('ui_comparator.shortcuts.toggle_all')}</span>
              <kbd className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono shadow-sm">
                ⌘⇧U
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
              <span className="text-sm text-muted-foreground">隐藏所有图层</span>
              <kbd className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono shadow-sm">
                Esc
              </kbd>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm text-muted-foreground">拖拽移动图层位置</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl border-0 bg-background/95 backdrop-blur-xl shadow-2xl max-w-sm mx-auto">
          <DialogHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">{t('dialog.delete.title')}</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-3 leading-relaxed">
              {t('dialog.delete.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="destructive"
                onClick={() => handleRemoveOverlay(overlayToDelete)}
                className="w-full rounded-2xl h-12 font-medium text-base"
              >
                {t('dialog.delete.confirm')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
                className="w-full rounded-2xl h-12 font-medium text-base hover:bg-muted/50"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear all confirmation dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent className="rounded-3xl border-0 bg-background/95 backdrop-blur-xl shadow-2xl max-w-sm mx-auto">
          <DialogHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <div className="w-8 h-8 flex flex-col gap-1">
                <div className="h-1 bg-orange-500 rounded-full opacity-40"></div>
                <div className="h-1 bg-orange-500 rounded-full opacity-60"></div>
                <div className="h-1 bg-orange-500 rounded-full opacity-80"></div>
                <div className="h-1 bg-orange-500 rounded-full"></div>
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">{t('dialog.clear_all.title')}</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-3 leading-relaxed">
              {t('dialog.clear_all.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="destructive"
                onClick={handleClearAllOverlays}
                className="w-full rounded-2xl h-12 font-medium text-base"
              >
                {t('dialog.clear_all.confirm')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setClearAllDialogOpen(false)}
                className="w-full rounded-2xl h-12 font-medium text-base hover:bg-muted/50"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Individual overlay item component
interface OverlayItemProps {
  overlay: UIOverlay;
  onOpacityChange: (id: string, opacity: number) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onToggleLock: (id: string, locked: boolean) => void;
  onRemove: (id: string) => void;
}

const OverlayItem: React.FC<OverlayItemProps> = ({
  overlay,
  onOpacityChange,
  onToggleVisibility,
  onToggleLock,
  onRemove,
}) => {
  const [localOpacity, setLocalOpacity] = useState(Math.round(overlay.opacity * 100));

  useEffect(() => {
    setLocalOpacity(Math.round(overlay.opacity * 100));
  }, [overlay.opacity]);

  const handleOpacityChange = (value: number[]) => {
    const newValue = value[0];
    setLocalOpacity(newValue);
    onOpacityChange(overlay.id, newValue);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Overlay preview */}
          <div className="flex-shrink-0">
            <img
              src={overlay.imageUrl}
              alt="UI Overlay"
              className="w-10 h-10 object-contain rounded"
              style={{ opacity: overlay.visible ? 1 : 0.3 }}
            />
          </div>

          {/* Overlay info and controls */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">图层 {overlay.id.slice(-4)}</div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleVisibility(overlay.id, overlay.visible)}
                  title={overlay.visible ? "隐藏图层" : "显示图层"}
                >
                  {overlay.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleLock(overlay.id, overlay.locked)}
                  title={overlay.locked ? "解锁图层" : "锁定图层"}
                >
                  {overlay.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(overlay.id)}
                  title="删除图层"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mb-2">
              {overlay.visible ? "显示" : "隐藏"} |{overlay.locked ? "已锁定" : "可移动"} | 透明度{" "}
              {localOpacity}%
            </div>

            {/* Position and size info */}
            <div className="text-xs text-muted-foreground mb-3">
              位置: ({overlay.position.x}, {overlay.position.y}) | 尺寸: {overlay.size.width}×
              {overlay.size.height}
            </div>

            {/* Opacity slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground min-w-[3rem]">透明度:</span>
              <Slider
                value={[localOpacity]}
                onValueChange={handleOpacityChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground min-w-[2.5rem]">{localOpacity}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
