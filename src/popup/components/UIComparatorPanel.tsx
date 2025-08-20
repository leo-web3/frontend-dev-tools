import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Upload, 
  Slider, 
  Input, 
  Space, 
  List, 
  Popconfirm,
  Select,
  message,
  Divider,
  Empty 
} from 'antd';
import type { UploadProps } from 'antd';
import { 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  CompressOutlined 
} from '@ant-design/icons';
import { UIOverlay } from '@/shared/types';
import { useExtensionStore } from '../hooks/useExtensionStore';
import { validateImageFile, readFileAsDataURL, generateId } from '@/shared/utils';
import { UI_CONSTANTS } from '@/shared/constants';

const { Option } = Select;

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
        message.error(errors[0]);
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
      message.success(`UI图片上传成功 (${width}×${height}px)`);
      return false; // Prevent default upload behavior
    } catch (error) {
      console.error('Upload error:', error);
      message.error('上传失败');
      return false;
    }
  };

  const uploadProps: UploadProps = {
    accept: UI_CONSTANTS.SUPPORTED_IMAGE_FORMATS.map(f => `.${f}`).join(','),
    beforeUpload: handleImageUpload,
    showUploadList: false,
    multiple: false,
  };

  const handleOpacityChange = async (overlayId: string, opacity: number) => {
    try {
      await updateOverlay(overlayId, { opacity: opacity / 100 });
    } catch (error) {
      message.error('透明度调整失败');
    }
  };

  const handleToggleVisibility = async (overlayId: string, visible: boolean) => {
    try {
      await updateOverlay(overlayId, { visible: !visible });
      message.success(`图层已${!visible ? '显示' : '隐藏'}`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToggleLock = async (overlayId: string, locked: boolean) => {
    try {
      await updateOverlay(overlayId, { locked: !locked });
      message.success(`图层已${!locked ? '锁定' : '解锁'}`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleRemoveOverlay = async (overlayId: string) => {
    try {
      await removeOverlay(overlayId);
      message.success('图层删除成功');
    } catch (error) {
      message.error('删除失败');
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
        message.success(`浏览器尺寸已调整为 ${width}x${height}`);
      } else {
        message.error(response?.error || '尺寸调整失败');
      }
    } catch (error) {
      console.error('Browser size adjustment error:', error);
      message.error('尺寸调整失败');
    }
  };

  const handleToggleAllOverlays = async () => {
    try {
      const visibleCount = currentOverlays.filter(o => o.visible).length;
      const shouldHide = visibleCount > 0;

      for (const overlay of currentOverlays) {
        await updateOverlay(overlay.id, { visible: !shouldHide });
      }

      message.success(`所有图层已${shouldHide ? '隐藏' : '显示'}`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleClearAllOverlays = async () => {
    try {
      for (const overlay of currentOverlays) {
        await removeOverlay(overlay.id);
      }
      message.success('所有图层已清除');
    } catch (error) {
      message.error('清除失败');
    }
  };

  if (!currentUrl) {
    return (
      <div className="panel-content">
        <Empty 
          description="无法获取当前页面信息"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="panel-content">
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Upload section */}
      <div className="panel-header">
        <Upload.Dragger {...uploadProps} className="upload-area">
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽UI设计稿到此处</p>
          <p className="ant-upload-hint">
            支持格式: {UI_CONSTANTS.SUPPORTED_IMAGE_FORMATS.join(', ')}
          </p>
        </Upload.Dragger>
      </div>

      <Divider />

      {/* Browser size adjustment */}
      <div className="browser-size-section">
        <h4>浏览器尺寸调整</h4>
        <div className="size-buttons">
          {UI_CONSTANTS.COMMON_SCREEN_SIZES.map(({ name, width, height }) => (
            <Button
              key={name}
              size="small"
              onClick={() => handleAdjustBrowserSize(width, height)}
              className="size-button"
            >
              {name}<br />
              <small>{width}x{height}</small>
            </Button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Overlays management */}
      <div className="overlays-section">
        <div className="section-header">
          <h4>图层管理 ({currentOverlays.length})</h4>
          {currentOverlays.length > 0 && (
            <Space>
              <Button 
                size="small" 
                onClick={handleToggleAllOverlays}
                icon={<EyeOutlined />}
              >
                切换显示
              </Button>
              <Popconfirm
                title="确定清除所有图层？"
                onConfirm={handleClearAllOverlays}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  size="small" 
                  danger
                  icon={<DeleteOutlined />}
                >
                  清除全部
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>

        {currentOverlays.length === 0 ? (
          <Empty 
            description="暂无UI图层"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            size="small"
            dataSource={currentOverlays}
            renderItem={(overlay) => (
              <OverlayItem
                key={overlay.id}
                overlay={overlay}
                onOpacityChange={handleOpacityChange}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
                onRemove={handleRemoveOverlay}
              />
            )}
          />
        )}
      </div>

      {/* Keyboard shortcuts info */}
      <Divider />
      <div className="shortcuts-info">
        <h4>快捷键</h4>
        <div className="shortcuts-list">
          <div><kbd>Ctrl+Shift+U</kbd> 切换所有图层显示/隐藏</div>
          <div><kbd>Esc</kbd> 隐藏所有图层</div>
          <div><strong>图层操作:</strong> 拖拽移动位置</div>
        </div>
      </div>
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

  const handleOpacityChange = (value: number) => {
    setLocalOpacity(value);
    onOpacityChange(overlay.id, value);
  };

  return (
    <List.Item className="overlay-item">
      <div className="overlay-content">
        {/* Overlay preview */}
        <div className="overlay-preview">
          <img 
            src={overlay.imageUrl} 
            alt="UI Overlay" 
            style={{ 
              width: 40, 
              height: 40, 
              objectFit: 'contain',
              opacity: overlay.visible ? 1 : 0.3
            }} 
          />
        </div>

        {/* Overlay info and controls */}
        <div className="overlay-info">
          <div className="overlay-title">
            图层 {overlay.id.slice(-4)}
            <div className="overlay-status">
              {overlay.visible ? '显示' : '隐藏'} | 
              {overlay.locked ? '已锁定' : '可移动'} | 
              透明度 {localOpacity}%
            </div>
          </div>

          {/* Position and size info */}
          <div className="overlay-details">
            位置: ({overlay.position.x}, {overlay.position.y}) | 
            尺寸: {overlay.size.width}×{overlay.size.height}
          </div>

          {/* Opacity slider */}
          <div className="opacity-control">
            <span>透明度:</span>
            <Slider
              min={0}
              max={100}
              value={localOpacity}
              onChange={handleOpacityChange}
              style={{ flex: 1, margin: '0 12px' }}
            />
            <span>{localOpacity}%</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="overlay-actions">
          <Button
            type="text"
            size="small"
            icon={overlay.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={() => onToggleVisibility(overlay.id, overlay.visible)}
            title={overlay.visible ? '隐藏图层' : '显示图层'}
          />
          <Button
            type="text"
            size="small"
            icon={overlay.locked ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => onToggleLock(overlay.id, overlay.locked)}
            title={overlay.locked ? '解锁图层' : '锁定图层'}
          />
          <Popconfirm
            title="确定删除这个图层？"
            onConfirm={() => onRemove(overlay.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="删除图层"
            />
          </Popconfirm>
        </div>
      </div>
    </List.Item>
  );
};