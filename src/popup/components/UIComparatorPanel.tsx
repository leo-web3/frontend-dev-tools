import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Upload, Trash2, Eye, EyeOff, Lock, Unlock, Monitor } from 'lucide-react';
import { UIOverlay } from '@/shared/types';
import { useExtensionStore } from '../hooks/useExtensionStore';
import { validateImageFile, readFileAsDataURL, generateId } from '@/shared/utils';
import { UI_CONSTANTS } from '@/shared/constants';

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

  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [overlayToDelete, setOverlayToDelete] = useState<string>('');
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
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
      console.error('Failed to get current URL:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const errors = validateImageFile(file);
      if (errors.length > 0) {
        showToast(errors[0], 'error');
        return false;
      }

      const imageUrl = await readFileAsDataURL(file);
      
      // Get image natural dimensions
      const getImageDimensions = (src: string): Promise<{width: number, height: number}> => {
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
        for (const existingOverlay of currentOverlays) {
          await removeOverlay(existingOverlay.id);
        }
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

      await createOverlay(overlay);
      showToast(`UI图片上传成功 (${width}×${height}px)`, 'success');
      return false; // Prevent default upload behavior
    } catch (error) {
      console.error('Upload error:', error);
      showToast('上传失败', 'error');
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
      showToast('透明度调整失败', 'error');
    }
  };

  const handleToggleVisibility = async (overlayId: string, visible: boolean) => {
    try {
      await updateOverlay(overlayId, { visible: !visible });
      showToast(`图层已${!visible ? '显示' : '隐藏'}`, 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleToggleLock = async (overlayId: string, locked: boolean) => {
    try {
      await updateOverlay(overlayId, { locked: !locked });
      showToast(`图层已${!locked ? '锁定' : '解锁'}`, 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleRemoveOverlay = async (overlayId: string) => {
    try {
      await removeOverlay(overlayId);
      showToast('图层删除成功', 'success');
      setDeleteDialogOpen(false);
      setOverlayToDelete('');
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const handleAdjustBrowserSize = async (width: number, height: number) => {
    try {
      console.log('Requesting browser size adjustment:', { width, height });
      
      const response = await chrome.runtime.sendMessage({
        type: 'ADJUST_BROWSER_SIZE',
        payload: { width, height }
      });

      console.log('Browser size adjustment response:', response);

      if (response?.success) {
        showToast(`浏览器尺寸已调整为 ${width}x${height}`, 'success');
      } else {
        showToast(response?.error || '尺寸调整失败', 'error');
      }
    } catch (error) {
      console.error('Browser size adjustment error:', error);
      showToast('尺寸调整失败', 'error');
    }
  };

  const handleToggleAllOverlays = async () => {
    try {
      const visibleCount = currentOverlays.filter(o => o.visible).length;
      const shouldHide = visibleCount > 0;

      for (const overlay of currentOverlays) {
        await updateOverlay(overlay.id, { visible: !shouldHide });
      }

      showToast(`所有图层已${shouldHide ? '隐藏' : '显示'}`, 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleClearAllOverlays = async () => {
    try {
      for (const overlay of currentOverlays) {
        await removeOverlay(overlay.id);
      }
      showToast('所有图层已清除', 'success');
      setClearAllDialogOpen(false);
    } catch (error) {
      showToast('清除失败', 'error');
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
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/15 text-destructive rounded-md text-sm">{error}</div>
      )}

      {/* Upload section */}
      <Card>
        <CardContent className="p-6">
          <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
            <input
              type="file"
              accept={UI_CONSTANTS.SUPPORTED_IMAGE_FORMATS.map(f => `.${f}`).join(',')}
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">点击或拖拽UI设计稿到此处</p>
            <p className="text-sm text-muted-foreground">
              支持格式: {UI_CONSTANTS.SUPPORTED_IMAGE_FORMATS.join(', ')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Browser size adjustment */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            浏览器尺寸调整
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {UI_CONSTANTS.COMMON_SCREEN_SIZES.map(({ name, width, height }) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => handleAdjustBrowserSize(width, height)}
                className="h-auto p-2 flex flex-col gap-1"
              >
                <span className="text-xs font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">{width}×{height}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overlays management */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">图层管理 ({currentOverlays.length})</h4>
            {currentOverlays.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={handleToggleAllOverlays}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  切换显示
                </Button>
                <Button 
                  variant="destructive"
                  size="sm" 
                  onClick={() => setClearAllDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  清除全部
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
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">快捷键</h4>
          <div className="space-y-1 text-sm">
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+U</kbd> 切换所有图层显示/隐藏
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> 隐藏所有图层
            </div>
            <div>
              <strong>图层操作:</strong> 拖拽移动位置
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个图层吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleRemoveOverlay(overlayToDelete)}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear all confirmation dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认清除</DialogTitle>
            <DialogDescription>
              确定要清除所有图层吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearAllDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearAllOverlays}
            >
              清除全部
            </Button>
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
              <div className="font-medium text-sm">
                图层 {overlay.id.slice(-4)}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleVisibility(overlay.id, overlay.visible)}
                  title={overlay.visible ? '隐藏图层' : '显示图层'}
                >
                  {overlay.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleLock(overlay.id, overlay.locked)}
                  title={overlay.locked ? '解锁图层' : '锁定图层'}
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
              {overlay.visible ? '显示' : '隐藏'} | 
              {overlay.locked ? '已锁定' : '可移动'} | 
              透明度 {localOpacity}%
            </div>

            {/* Position and size info */}
            <div className="text-xs text-muted-foreground mb-3">
              位置: ({overlay.position.x}, {overlay.position.y}) | 
              尺寸: {overlay.size.width}×{overlay.size.height}
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