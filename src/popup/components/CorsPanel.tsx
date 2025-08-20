import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Plus, X, ChevronDown } from 'lucide-react';
import { useExtensionStore } from '../hooks/useExtensionStore';

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

  const [newOrigin, setNewOrigin] = useState('');
  const [newHeader, setNewHeader] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadCorsConfig();
  }, [loadCorsConfig]);

  useEffect(() => {
    setSelectedMethods(corsConfig.allowedMethods || []);
  }, [corsConfig.allowedMethods]);

  const handleToggleCors = async (enabled: boolean) => {
    try {
      await toggleCors(enabled);
      showToast(`CORS已${enabled ? '启用' : '禁用'}`, 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleAddOrigin = async () => {
    if (!newOrigin.trim()) {
      showToast('请输入有效的源地址', 'error');
      return;
    }

    try {
      const origins = [...corsConfig.allowedOrigins];
      if (!origins.includes(newOrigin)) {
        origins.push(newOrigin);
        await updateCorsConfig({ allowedOrigins: origins });
        setNewOrigin('');
        showToast('源地址添加成功', 'success');
      } else {
        showToast('该源地址已存在', 'error');
      }
    } catch (error) {
      showToast('添加失败', 'error');
    }
  };

  const handleRemoveOrigin = async (origin: string) => {
    try {
      const origins = corsConfig.allowedOrigins.filter(o => o !== origin);
      await updateCorsConfig({ allowedOrigins: origins });
      showToast('源地址删除成功', 'success');
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const handleAddHeader = async () => {
    if (!newHeader.trim()) {
      showToast('请输入有效的请求头', 'error');
      return;
    }

    try {
      const headers = [...corsConfig.allowedHeaders];
      if (!headers.includes(newHeader)) {
        headers.push(newHeader);
        await updateCorsConfig({ allowedHeaders: headers });
        setNewHeader('');
        showToast('请求头添加成功', 'success');
      } else {
        showToast('该请求头已存在', 'error');
      }
    } catch (error) {
      showToast('添加失败', 'error');
    }
  };

  const handleRemoveHeader = async (header: string) => {
    try {
      const headers = corsConfig.allowedHeaders.filter(h => h !== header);
      await updateCorsConfig({ allowedHeaders: headers });
      showToast('请求头删除成功', 'success');
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const handleUpdateMethods = async (methods: string[]) => {
    try {
      await updateCorsConfig({ allowedMethods: methods });
      setSelectedMethods(methods);
      showToast('HTTP方法更新成功', 'success');
    } catch (error) {
      showToast('更新失败', 'error');
    }
  };

  const handleToggleCredentials = async (enabled: boolean) => {
    try {
      await updateCorsConfig({ credentials: enabled });
      showToast(`凭证支持已${enabled ? '启用' : '禁用'}`, 'success');
    } catch (error) {
      showToast('操作失败', 'error');
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

  const toggleMethod = (method: string) => {
    const newMethods = selectedMethods.includes(method) 
      ? selectedMethods.filter(m => m !== method)
      : [...selectedMethods, method];
    handleUpdateMethods(newMethods);
  };

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

      {/* CORS Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={corsEnabled}
                onCheckedChange={handleToggleCors}
                disabled={loading}
              />
              <span className="text-sm font-medium">
                启用跨域请求处理
              </span>
            </div>
            
            <Badge variant={corsEnabled ? "default" : "secondary"}>
              {corsEnabled ? 'CORS已启用' : 'CORS已禁用'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {corsEnabled && (
        <>
          {/* Allowed Origins */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">允许的源地址 (Origins)</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        常用 <ChevronDown className="ml-1 w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {commonOrigins.map(origin => (
                        <DropdownMenuItem 
                          key={origin} 
                          onClick={() => setNewOrigin(origin)}
                        >
                          {origin}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Input
                    className="flex-1"
                    placeholder="输入自定义源地址"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddOrigin();
                      }
                    }}
                  />
                  <Button onClick={handleAddOrigin} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {corsConfig.allowedOrigins.map((origin) => (
                    <div key={origin} className="flex items-center justify-between p-2 bg-muted rounded">
                      <Badge variant="outline">{origin}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOrigin(origin)}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HTTP Methods */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">允许的HTTP方法</h4>
              <div className="flex flex-wrap gap-2">
                {httpMethods.map(method => (
                  <Button
                    key={method}
                    variant={selectedMethods.includes(method) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Allowed Headers */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">允许的请求头</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        常用 <ChevronDown className="ml-1 w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {commonHeaders.map(header => (
                        <DropdownMenuItem 
                          key={header} 
                          onClick={() => setNewHeader(header)}
                        >
                          {header}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Input
                    className="flex-1"
                    placeholder="输入自定义请求头"
                    value={newHeader}
                    onChange={(e) => setNewHeader(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddHeader();
                      }
                    }}
                  />
                  <Button onClick={handleAddHeader} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {corsConfig.allowedHeaders.map((header) => (
                    <Badge 
                      key={header} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveHeader(header)}
                    >
                      {header} <X className="ml-1 w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">允许凭证 (Credentials)</div>
                  <div className="text-sm text-muted-foreground">
                    允许请求携带Cookie和认证信息
                  </div>
                </div>
                <Switch
                  checked={corsConfig.credentials}
                  onCheckedChange={handleToggleCredentials}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!corsEnabled && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground space-y-2">
              <p>启用CORS处理后，可以配置跨域请求的详细规则。</p>
              <p>这将允许您的前端应用绕过浏览器的同源策略限制。</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};