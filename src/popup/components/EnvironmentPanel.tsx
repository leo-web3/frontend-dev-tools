import React, { useState, useEffect } from 'react';
import { 
  Switch, 
  Button, 
  Input, 
  Space, 
  List, 
  Popconfirm, 
  Upload, 
  message,
  Divider,
  Empty 
} from 'antd';
import type { UploadProps } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  UploadOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { EnvironmentVariable } from '@/shared/types';
import { useExtensionStore } from '../hooks/useExtensionStore';
import { parseEnvFile, validateEnvironmentVariable } from '@/shared/utils';

interface EnvironmentPanelProps {
  currentDomain: string;
}

export const EnvironmentPanel: React.FC<EnvironmentPanelProps> = ({ currentDomain }) => {
  const {
    currentEnvironmentConfig,
    loading,
    error,
    loadEnvironmentConfig,
    addEnvironmentVariable,
    updateEnvironmentVariable,
    removeEnvironmentVariable,
    toggleEnvironmentVariable,
    toggleGlobalEnvironment,
  } = useExtensionStore();

  const [editingKey, setEditingKey] = useState<string>('');
  const [newVariable, setNewVariable] = useState<EnvironmentVariable>({
    key: '',
    value: '',
    enabled: true,
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (currentDomain) {
      loadEnvironmentConfig(currentDomain);
    }
  }, [currentDomain, loadEnvironmentConfig]);

  const handleToggleGlobal = async (enabled: boolean) => {
    try {
      await toggleGlobalEnvironment(currentDomain, enabled);
      message.success(`环境变量已${enabled ? '启用' : '禁用'}`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAddVariable = async () => {
    try {
      const errors = validateEnvironmentVariable(newVariable);
      if (errors.length > 0) {
        message.error(errors[0]);
        return;
      }

      await addEnvironmentVariable(currentDomain, newVariable);
      setNewVariable({ key: '', value: '', enabled: true });
      setShowAddForm(false);
      message.success('环境变量添加成功');
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleUpdateVariable = async (variable: EnvironmentVariable) => {
    try {
      const errors = validateEnvironmentVariable(variable);
      if (errors.length > 0) {
        message.error(errors[0]);
        return;
      }

      await updateEnvironmentVariable(currentDomain, variable);
      setEditingKey('');
      message.success('环境变量更新成功');
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleRemoveVariable = async (key: string) => {
    try {
      await removeEnvironmentVariable(currentDomain, key);
      message.success('环境变量删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleVariable = async (key: string) => {
    try {
      await toggleEnvironmentVariable(currentDomain, key);
    } catch (error) {
      message.error('切换失败');
    }
  };

  const handleInjectVariables = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'INJECT_ENVIRONMENT',
        payload: currentEnvironmentConfig.variables.filter(v => v.enabled)
      });

      if (response.success) {
        message.success('环境变量注入成功');
      } else {
        message.error(response.error || '注入失败');
      }
    } catch (error) {
      message.error('注入失败');
    }
  };

  const uploadProps: UploadProps = {
    accept: '.env',
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const variables = parseEnvFile(content);
          
          // Add all parsed variables
          for (const variable of variables) {
            await addEnvironmentVariable(currentDomain, variable);
          }
          
          message.success(`成功导入 ${variables.length} 个环境变量`);
        } catch (error) {
          message.error('文件解析失败');
        }
      };
      reader.readAsText(file);
      return false; // Prevent automatic upload
    },
    showUploadList: false,
  };

  if (!currentDomain) {
    return (
      <div className="panel-content">
        <Empty 
          description="无法获取当前域名信息"
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

      {/* Global toggle and actions */}
      <div className="panel-header">
        <div className="global-toggle">
          <Switch
            checked={currentEnvironmentConfig.globalEnabled}
            onChange={handleToggleGlobal}
            loading={loading}
          />
          <span className="toggle-label">
            启用环境变量注入 ({currentDomain})
          </span>
        </div>
        
        <Space>
          <Upload {...uploadProps}>
            <Button 
              icon={<UploadOutlined />}
              size="small"
              type="dashed"
            >
              导入.env
            </Button>
          </Upload>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={handleInjectVariables}
            disabled={!currentEnvironmentConfig.globalEnabled}
            type="primary"
            size="small"
          >
            注入变量
          </Button>
        </Space>
      </div>

      <Divider />

      {/* Variables list */}
      <div className="variables-list">
        {currentEnvironmentConfig.variables.length === 0 ? (
          <Empty 
            description="暂无环境变量"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary" 
              onClick={() => setShowAddForm(true)}
              icon={<PlusOutlined />}
            >
              添加环境变量
            </Button>
          </Empty>
        ) : (
          <List
            size="small"
            dataSource={currentEnvironmentConfig.variables}
            renderItem={(variable) => (
              <List.Item
                actions={[
                  <Switch
                    key="toggle"
                    size="small"
                    checked={variable.enabled}
                    onChange={() => handleToggleVariable(variable.key)}
                  />,
                  <Button
                    key="edit"
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditingKey(variable.key)}
                  />,
                  <Popconfirm
                    key="delete"
                    title="确定删除这个环境变量？"
                    onConfirm={() => handleRemoveVariable(variable.key)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                ]}
              >
                <VariableItem
                  variable={variable}
                  isEditing={editingKey === variable.key}
                  onSave={handleUpdateVariable}
                  onCancel={() => setEditingKey('')}
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Add new variable form */}
      {showAddForm && (
        <>
          <Divider />
          <div className="add-variable-form">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="变量名 (e.g., API_URL)"
                value={newVariable.key}
                onChange={(e) => setNewVariable({ ...newVariable, key: e.target.value })}
              />
              <Input
                placeholder="变量值"
                value={newVariable.value}
                onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
              />
              <Space>
                <Button 
                  type="primary" 
                  onClick={handleAddVariable}
                  disabled={!newVariable.key.trim() || loading}
                >
                  添加
                </Button>
                <Button onClick={() => setShowAddForm(false)}>
                  取消
                </Button>
              </Space>
            </Space>
          </div>
        </>
      )}

      {/* Add button when not showing form */}
      {!showAddForm && currentEnvironmentConfig.variables.length > 0 && (
        <>
          <Divider />
          <Button 
            type="dashed" 
            block 
            icon={<PlusOutlined />}
            onClick={() => setShowAddForm(true)}
          >
            添加环境变量
          </Button>
        </>
      )}
    </div>
  );
};

// Variable item component for inline editing
interface VariableItemProps {
  variable: EnvironmentVariable;
  isEditing: boolean;
  onSave: (variable: EnvironmentVariable) => void;
  onCancel: () => void;
}

const VariableItem: React.FC<VariableItemProps> = ({
  variable,
  isEditing,
  onSave,
  onCancel,
}) => {
  const [editValue, setEditValue] = useState(variable.value);

  useEffect(() => {
    setEditValue(variable.value);
  }, [variable.value]);

  if (isEditing) {
    return (
      <div className="variable-edit" style={{ width: '100%' }}>
        <div className="variable-key">{variable.key}</div>
        <Space style={{ width: '100%' }}>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onPressEnter={() => onSave({ ...variable, value: editValue })}
            style={{ flex: 1 }}
          />
          <Button 
            type="text" 
            size="small"
            onClick={() => onSave({ ...variable, value: editValue })}
          >
            保存
          </Button>
          <Button 
            type="text" 
            size="small"
            onClick={onCancel}
          >
            取消
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <div className="variable-display">
      <div className="variable-key">{variable.key}</div>
      <div className="variable-value">{variable.value}</div>
    </div>
  );
};