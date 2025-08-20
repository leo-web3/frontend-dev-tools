import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit3, Upload, RotateCcw } from 'lucide-react';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<string>('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (currentDomain) {
      loadEnvironmentConfig(currentDomain);
    }
  }, [currentDomain, loadEnvironmentConfig]);

  const handleToggleGlobal = async (enabled: boolean) => {
    try {
      await toggleGlobalEnvironment(currentDomain, enabled);
      showToast(`环境变量已${enabled ? '启用' : '禁用'}`, 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleAddVariable = async () => {
    try {
      const errors = validateEnvironmentVariable(newVariable);
      if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
      }

      await addEnvironmentVariable(currentDomain, newVariable);
      setNewVariable({ key: '', value: '', enabled: true });
      setShowAddForm(false);
      showToast('环境变量添加成功', 'success');
    } catch (error) {
      showToast('添加失败', 'error');
    }
  };

  const handleUpdateVariable = async (variable: EnvironmentVariable) => {
    try {
      const errors = validateEnvironmentVariable(variable);
      if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
      }

      await updateEnvironmentVariable(currentDomain, variable);
      setEditingKey('');
      showToast('环境变量更新成功', 'success');
    } catch (error) {
      showToast('更新失败', 'error');
    }
  };

  const handleRemoveVariable = async (key: string) => {
    try {
      await removeEnvironmentVariable(currentDomain, key);
      showToast('环境变量删除成功', 'success');
      setDeleteDialogOpen(false);
      setVariableToDelete('');
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const handleToggleVariable = async (key: string) => {
    try {
      await toggleEnvironmentVariable(currentDomain, key);
    } catch (error) {
      showToast('切换失败', 'error');
    }
  };

  const handleInjectVariables = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'INJECT_ENVIRONMENT',
        payload: currentEnvironmentConfig.variables.filter(v => v.enabled)
      });

      if (response.success) {
        showToast('环境变量注入成功', 'success');
      } else {
        showToast(response.error || '注入失败', 'error');
      }
    } catch (error) {
      showToast('注入失败', 'error');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const variables = parseEnvFile(content);
        
        // Add all parsed variables
        for (const variable of variables) {
          await addEnvironmentVariable(currentDomain, variable);
        }
        
        showToast(`成功导入 ${variables.length} 个环境变量`, 'success');
      } catch (error) {
        showToast('文件解析失败', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (!currentDomain) {
    return (
      <div className="p-4 text-center">
        <div className="text-muted-foreground">无法获取当前域名信息</div>
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

      {/* Global toggle and actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={currentEnvironmentConfig.globalEnabled}
                onCheckedChange={handleToggleGlobal}
                disabled={loading}
              />
              <span className="text-sm font-medium">
                启用环境变量注入 ({currentDomain})
              </span>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="file"
                  accept=".env"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm" className="relative">
                  <Upload className="w-4 h-4 mr-1" />
                  导入.env
                </Button>
              </div>
              
              <Button
                onClick={handleInjectVariables}
                disabled={!currentEnvironmentConfig.globalEnabled}
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                注入变量
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variables list */}
      <div className="space-y-2">
        {currentEnvironmentConfig.variables.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground mb-4">暂无环境变量</div>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                添加环境变量
              </Button>
            </CardContent>
          </Card>
        ) : (
          currentEnvironmentConfig.variables.map((variable) => (
            <Card key={variable.key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <VariableItem
                    variable={variable}
                    isEditing={editingKey === variable.key}
                    onSave={handleUpdateVariable}
                    onCancel={() => setEditingKey('')}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={variable.enabled}
                      onCheckedChange={() => handleToggleVariable(variable.key)}
                      size="sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingKey(variable.key)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setVariableToDelete(variable.key);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add new variable form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
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
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddVariable}
                  disabled={!newVariable.key.trim() || loading}
                >
                  添加
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  取消
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add button when not showing form */}
      {!showAddForm && currentEnvironmentConfig.variables.length > 0 && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          添加环境变量
        </Button>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除环境变量 "{variableToDelete}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleRemoveVariable(variableToDelete)}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      <div className="flex-1 space-y-2">
        <div className="font-medium text-sm">{variable.key}</div>
        <div className="flex gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSave({ ...variable, value: editValue });
              }
            }}
            className="flex-1"
          />
          <Button 
            size="sm"
            onClick={() => onSave({ ...variable, value: editValue })}
          >
            保存
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCancel}
          >
            取消
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="font-medium text-sm">{variable.key}</div>
      <div className="text-sm text-muted-foreground truncate">{variable.value}</div>
    </div>
  );
};