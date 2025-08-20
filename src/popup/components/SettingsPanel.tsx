import React, { useEffect } from 'react';
import { 
  Switch, 
  Button, 
  Select, 
  Space, 
  Divider,
  Input,
  message,
  Upload,
  Download 
} from 'antd';
import type { UploadProps } from 'antd';
import { 
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { useExtensionStore } from '../hooks/useExtensionStore';
import { storageManager } from '@/shared/storage';

const { Option } = Select;
const { TextArea } = Input;

export const SettingsPanel: React.FC = () => {
  const {
    globalSettings,
    loading,
    error,
    loadGlobalSettings,
    updateGlobalSettings,
  } = useExtensionStore();

  useEffect(() => {
    loadGlobalSettings();
  }, [loadGlobalSettings]);

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    try {
      await updateGlobalSettings({ theme });
      message.success('主题设置已保存');
    } catch (error) {
      message.error('主题设置失败');
    }
  };

  const handleLanguageChange = async (language: 'zh' | 'en') => {
    try {
      await updateGlobalSettings({ language });
      message.success('语言设置已保存');
    } catch (error) {
      message.error('语言设置失败');
    }
  };

  const handleShortcutChange = async (action: string, shortcut: string) => {
    try {
      const shortcuts = { ...globalSettings.shortcuts, [action]: shortcut };
      await updateGlobalSettings({ shortcuts });
      message.success('快捷键设置已保存');
    } catch (error) {
      message.error('快捷键设置失败');
    }
  };

  const handleExportConfig = async () => {
    try {
      const data = await storageManager.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `fe-dev-tools-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success('配置导出成功');
    } catch (error) {
      message.error('配置导出失败');
    }
  };

  const uploadProps: UploadProps = {
    accept: '.json',
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          await storageManager.importData(content);
          message.success('配置导入成功，请刷新扩展');
        } catch (error) {
          message.error('配置导入失败：数据格式错误');
        }
      };
      reader.readAsText(file);
      return false;
    },
    showUploadList: false,
  };

  const handleResetSettings = async () => {
    try {
      await storageManager.clear();
      message.success('设置已重置，请刷新扩展');
    } catch (error) {
      message.error('设置重置失败');
    }
  };

  const getStorageUsage = async () => {
    try {
      const usage = await storageManager.getUsage();
      const usagePercent = (usage.bytesInUse / usage.quotaBytes * 100).toFixed(1);
      message.info(`存储使用情况: ${usage.bytesInUse} / ${usage.quotaBytes} bytes (${usagePercent}%)`);
    } catch (error) {
      message.error('获取存储信息失败');
    }
  };

  return (
    <div className="panel-content">
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Appearance Settings */}
      <div className="settings-section">
        <h4>外观设置</h4>
        <div className="setting-item">
          <div className="setting-label">
            <strong>主题</strong>
            <div className="setting-description">选择扩展程序的外观主题</div>
          </div>
          <Select
            value={globalSettings.theme}
            onChange={handleThemeChange}
            style={{ width: 120 }}
          >
            <Option value="light">浅色</Option>
            <Option value="dark">深色</Option>
          </Select>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <strong>语言</strong>
            <div className="setting-description">选择界面显示语言</div>
          </div>
          <Select
            value={globalSettings.language}
            onChange={handleLanguageChange}
            style={{ width: 120 }}
          >
            <Option value="zh">中文</Option>
            <Option value="en">English</Option>
          </Select>
        </div>
      </div>

      <Divider />

      {/* Keyboard Shortcuts */}
      <div className="settings-section">
        <h4>快捷键设置</h4>
        <div className="shortcuts-settings">
          <div className="setting-item">
            <div className="setting-label">
              <strong>切换CORS</strong>
            </div>
            <Input
              value={globalSettings.shortcuts.toggleCors}
              onChange={(e) => handleShortcutChange('toggleCors', e.target.value)}
              placeholder="例如: Ctrl+Shift+C"
              style={{ width: 160 }}
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <strong>切换环境变量</strong>
            </div>
            <Input
              value={globalSettings.shortcuts.toggleEnvironment}
              onChange={(e) => handleShortcutChange('toggleEnvironment', e.target.value)}
              placeholder="例如: Ctrl+Shift+E"
              style={{ width: 160 }}
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <strong>切换UI比对</strong>
            </div>
            <Input
              value={globalSettings.shortcuts.toggleUIComparator}
              onChange={(e) => handleShortcutChange('toggleUIComparator', e.target.value)}
              placeholder="例如: Ctrl+Shift+U"
              style={{ width: 160 }}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* Data Management */}
      <div className="settings-section">
        <h4>数据管理</h4>
        <div className="data-management">
          <div className="setting-item">
            <div className="setting-label">
              <strong>导出配置</strong>
              <div className="setting-description">
                导出当前所有设置和配置到JSON文件
              </div>
            </div>
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleExportConfig}
            >
              导出
            </Button>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <strong>导入配置</strong>
              <div className="setting-description">
                从JSON文件导入设置和配置
              </div>
            </div>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                导入
              </Button>
            </Upload>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <strong>存储使用情况</strong>
              <div className="setting-description">
                查看扩展程序的存储使用情况
              </div>
            </div>
            <Button onClick={getStorageUsage}>
              查看
            </Button>
          </div>
        </div>
      </div>

      <Divider />

      {/* Danger Zone */}
      <div className="settings-section danger-zone">
        <h4 style={{ color: '#ff4d4f' }}>危险操作</h4>
        <div className="setting-item">
          <div className="setting-label">
            <strong>重置所有设置</strong>
            <div className="setting-description" style={{ color: '#ff4d4f' }}>
              这将清除所有配置数据，包括环境变量、CORS设置和UI图层
            </div>
          </div>
          <Button 
            danger
            onClick={handleResetSettings}
            icon={<ReloadOutlined />}
          >
            重置设置
          </Button>
        </div>
      </div>

      <Divider />

      {/* About */}
      <div className="settings-section">
        <h4>关于</h4>
        <div className="about-info">
          <div><strong>Frontend Dev Tools</strong></div>
          <div>版本: 1.0.0</div>
          <div>专为前端开发者设计的Chrome扩展工具</div>
          <div style={{ marginTop: 12 }}>
            <strong>功能特性：</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>环境变量管理和注入</li>
              <li>跨域请求处理</li>
              <li>UI设计稿像素级比对</li>
              <li>浏览器尺寸快速调整</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};