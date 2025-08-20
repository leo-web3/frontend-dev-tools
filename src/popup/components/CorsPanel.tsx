import React, { useEffect } from 'react';
import { 
  Switch, 
  Button, 
  Input, 
  Space, 
  List, 
  Tag, 
  Divider,
  Select,
  message 
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ReloadOutlined 
} from '@ant-design/icons';
import { useExtensionStore } from '../hooks/useExtensionStore';

const { Option } = Select;

export const CorsPanel: React.FC = () => {
  const {
    corsConfig,
    corsEnabled,
    loading,
    error,
    loadCorsConfig,
    updateCorsConfig,
    toggleCors,
  } = useExtensionStore();

  const [newOrigin, setNewOrigin] = React.useState('');
  const [newHeader, setNewHeader] = React.useState('');

  useEffect(() => {
    loadCorsConfig();
  }, [loadCorsConfig]);

  const handleToggleCors = async (enabled: boolean) => {
    try {
      await toggleCors(enabled);
      message.success(`CORS已${enabled ? '启用' : '禁用'}`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAddOrigin = async () => {
    if (!newOrigin.trim()) {
      message.warning('请输入有效的源地址');
      return;
    }

    try {
      const origins = [...corsConfig.allowedOrigins];
      if (!origins.includes(newOrigin)) {
        origins.push(newOrigin);
        await updateCorsConfig({ allowedOrigins: origins });
        setNewOrigin('');
        message.success('源地址添加成功');
      } else {
        message.warning('该源地址已存在');
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleRemoveOrigin = async (origin: string) => {
    try {
      const origins = corsConfig.allowedOrigins.filter(o => o !== origin);
      await updateCorsConfig({ allowedOrigins: origins });
      message.success('源地址删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleAddHeader = async () => {
    if (!newHeader.trim()) {
      message.warning('请输入有效的请求头');
      return;
    }

    try {
      const headers = [...corsConfig.allowedHeaders];
      if (!headers.includes(newHeader)) {
        headers.push(newHeader);
        await updateCorsConfig({ allowedHeaders: headers });
        setNewHeader('');
        message.success('请求头添加成功');
      } else {
        message.warning('该请求头已存在');
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleRemoveHeader = async (header: string) => {
    try {
      const headers = corsConfig.allowedHeaders.filter(h => h !== header);
      await updateCorsConfig({ allowedHeaders: headers });
      message.success('请求头删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleUpdateMethods = async (methods: string[]) => {
    try {
      await updateCorsConfig({ allowedMethods: methods });
      message.success('HTTP方法更新成功');
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleToggleCredentials = async (enabled: boolean) => {
    try {
      await updateCorsConfig({ credentials: enabled });
      message.success(`凭证支持已${enabled ? '启用' : '禁用'}`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const commonOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
    '*'
  ];

  const commonHeaders = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ];

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'];

  return (
    <div className="panel-content">
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* CORS Toggle */}
      <div className="panel-header">
        <div className="global-toggle">
          <Switch
            checked={corsEnabled}
            onChange={handleToggleCors}
            loading={loading}
          />
          <span className="toggle-label">
            启用跨域请求处理
          </span>
        </div>
        
        <div className="cors-status">
          <Tag color={corsEnabled ? 'green' : 'default'}>
            {corsEnabled ? 'CORS已启用' : 'CORS已禁用'}
          </Tag>
        </div>
      </div>

      <Divider />

      {corsEnabled && (
        <>
          {/* Allowed Origins */}
          <div className="config-section">
            <h4>允许的源地址 (Origins)</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="add-item-form">
                <Input.Group compact>
                  <Select
                    style={{ width: '30%' }}
                    placeholder="常用"
                    value={newOrigin}
                    onChange={setNewOrigin}
                    allowClear
                  >
                    {commonOrigins.map(origin => (
                      <Option key={origin} value={origin}>
                        {origin}
                      </Option>
                    ))}
                  </Select>
                  <Input
                    style={{ width: '50%' }}
                    placeholder="或输入自定义源地址"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    onPressEnter={handleAddOrigin}
                  />
                  <Button 
                    style={{ width: '20%' }}
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAddOrigin}
                  />
                </Input.Group>
              </div>
              
              <List
                size="small"
                dataSource={corsConfig.allowedOrigins}
                renderItem={(origin) => (
                  <List.Item
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveOrigin(origin)}
                      />
                    ]}
                  >
                    <Tag color="blue">{origin}</Tag>
                  </List.Item>
                )}
              />
            </Space>
          </div>

          <Divider />

          {/* HTTP Methods */}
          <div className="config-section">
            <h4>允许的HTTP方法</h4>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="选择允许的HTTP方法"
              value={corsConfig.allowedMethods}
              onChange={handleUpdateMethods}
            >
              {httpMethods.map(method => (
                <Option key={method} value={method}>
                  {method}
                </Option>
              ))}
            </Select>
          </div>

          <Divider />

          {/* Allowed Headers */}
          <div className="config-section">
            <h4>允许的请求头</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="add-item-form">
                <Input.Group compact>
                  <Select
                    style={{ width: '30%' }}
                    placeholder="常用"
                    value={newHeader}
                    onChange={setNewHeader}
                    allowClear
                  >
                    {commonHeaders.map(header => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                  <Input
                    style={{ width: '50%' }}
                    placeholder="或输入自定义请求头"
                    value={newHeader}
                    onChange={(e) => setNewHeader(e.target.value)}
                    onPressEnter={handleAddHeader}
                  />
                  <Button 
                    style={{ width: '20%' }}
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAddHeader}
                  />
                </Input.Group>
              </div>
              
              <div className="headers-list">
                {corsConfig.allowedHeaders.map((header) => (
                  <Tag 
                    key={header}
                    closable
                    color="purple"
                    onClose={() => handleRemoveHeader(header)}
                  >
                    {header}
                  </Tag>
                ))}
              </div>
            </Space>
          </div>

          <Divider />

          {/* Credentials */}
          <div className="config-section">
            <div className="config-option">
              <div>
                <strong>允许凭证 (Credentials)</strong>
                <div className="option-description">
                  允许请求携带Cookie和认证信息
                </div>
              </div>
              <Switch
                checked={corsConfig.credentials}
                onChange={handleToggleCredentials}
              />
            </div>
          </div>
        </>
      )}

      {!corsEnabled && (
        <div className="disabled-notice">
          <p>启用CORS处理后，可以配置跨域请求的详细规则。</p>
          <p>这将允许您的前端应用绕过浏览器的同源策略限制。</p>
        </div>
      )}
    </div>
  );
};