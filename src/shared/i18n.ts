export interface I18nKeys {
  // Common
  'common.cancel': string;
  'common.confirm': string;
  'common.delete': string;
  'common.save': string;
  'common.close': string;
  'common.loading': string;
  
  // App Header
  'app.title': string;
  'app.theme.light': string;
  'app.theme.dark': string;
  'app.language.switch_to_english': string;
  'app.language.switch_to_chinese': string;
  
  // Tabs
  'tabs.ui_comparator': string;
  'tabs.settings': string;
  
  // UI Comparator
  'ui_comparator.upload.title': string;
  'ui_comparator.upload.description': string;
  'ui_comparator.upload.success': string;
  'ui_comparator.upload.error': string;
  
  'ui_comparator.browser_size.title': string;
  
  'ui_comparator.layers.title': string;
  'ui_comparator.layers.empty': string;
  'ui_comparator.layers.toggle_all': string;
  'ui_comparator.layers.clear_all': string;
  
  'ui_comparator.shortcuts.title': string;
  'ui_comparator.shortcuts.toggle_all': string;
  'ui_comparator.shortcuts.hide_all': string;
  'ui_comparator.shortcuts.drag_to_move': string;
  
  // Dialogs
  'dialog.delete.title': string;
  'dialog.delete.description': string;
  'dialog.delete.confirm': string;
  
  'dialog.clear_all.title': string;
  'dialog.clear_all.description': string;
  'dialog.clear_all.confirm': string;
  
  // Settings
  'settings.title': string;
  'settings.theme': string;
  'settings.language': string;
  
  // Toast Messages
  'toast.layer_deleted': string;
  'toast.layers_cleared': string;
  'toast.layer_toggled_visible': string;
  'toast.layer_toggled_hidden': string;
  'toast.layer_locked': string;
  'toast.layer_unlocked': string;
  'toast.all_layers_visible': string;
  'toast.all_layers_hidden': string;
  'toast.browser_size_adjusted': string;
  'toast.operation_failed': string;
}

export const translations = {
  zh: {
    // Common
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.delete': '删除',
    'common.save': '保存',
    'common.close': '关闭',
    'common.loading': '加载中...',
    
    // App Header
    'app.title': 'Frontend Dev Tools',
    'app.theme.light': '切换到深色模式',
    'app.theme.dark': '切换到浅色模式',
    'app.language.switch_to_english': 'Switch to English',
    'app.language.switch_to_chinese': '切换到中文',
    
    // Tabs
    'tabs.ui_comparator': '样式对比',
    'tabs.settings': '设置',
    
    // UI Comparator
    'ui_comparator.upload.title': '上传 UI 设计稿',
    'ui_comparator.upload.description': '支持格式：',
    'ui_comparator.upload.success': 'UI图片上传成功，窗口宽度已调整为',
    'ui_comparator.upload.error': '上传失败',
    
    'ui_comparator.browser_size.title': '浏览器尺寸',
    
    'ui_comparator.layers.title': '图层管理',
    'ui_comparator.layers.empty': '暂无图层',
    'ui_comparator.layers.toggle_all': '切换',
    'ui_comparator.layers.clear_all': '清除',
    
    'ui_comparator.shortcuts.title': '快捷键',
    'ui_comparator.shortcuts.toggle_all': '切换所有图层',
    'ui_comparator.shortcuts.hide_all': '隐藏所有图层',
    'ui_comparator.shortcuts.drag_to_move': '拖拽移动图层位置',
    
    // Dialogs
    'dialog.delete.title': '删除图层',
    'dialog.delete.description': '这个操作无法撤销，确定要继续吗？',
    'dialog.delete.confirm': '删除图层',
    
    'dialog.clear_all.title': '清除所有图层',
    'dialog.clear_all.description': '这个操作无法撤销，确定要继续吗？',
    'dialog.clear_all.confirm': '清除所有图层',
    
    // Settings
    'settings.title': '设置',
    'settings.theme': '主题',
    'settings.language': '语言',
    
    // Toast Messages
    'toast.layer_deleted': '图层删除成功',
    'toast.layers_cleared': '所有图层已清除',
    'toast.layer_toggled_visible': '图层已显示',
    'toast.layer_toggled_hidden': '图层已隐藏',
    'toast.layer_locked': '图层已锁定',
    'toast.layer_unlocked': '图层已解锁',
    'toast.all_layers_visible': '所有图层已显示',
    'toast.all_layers_hidden': '所有图层已隐藏',
    'toast.browser_size_adjusted': '浏览器尺寸已调整为',
    'toast.operation_failed': '操作失败',
  } as I18nKeys,
  
  en: {
    // Common
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    
    // App Header
    'app.title': 'Frontend Dev Tools',
    'app.theme.light': 'Switch to dark mode',
    'app.theme.dark': 'Switch to light mode',
    'app.language.switch_to_english': 'Switch to English',
    'app.language.switch_to_chinese': '切换到中文',
    
    // Tabs
    'tabs.ui_comparator': 'Style Checker',
    'tabs.settings': 'Settings',
    
    // UI Comparator
    'ui_comparator.upload.title': 'Upload UI Design',
    'ui_comparator.upload.description': 'Supported formats: ',
    'ui_comparator.upload.success': 'UI image uploaded successfully, window width adjusted to',
    'ui_comparator.upload.error': 'Upload failed',
    
    'ui_comparator.browser_size.title': 'Browser Size',
    
    'ui_comparator.layers.title': 'Layer Management',
    'ui_comparator.layers.empty': 'No layers',
    'ui_comparator.layers.toggle_all': 'Toggle',
    'ui_comparator.layers.clear_all': 'Clear',
    
    'ui_comparator.shortcuts.title': 'Shortcuts',
    'ui_comparator.shortcuts.toggle_all': 'Toggle all layers',
    'ui_comparator.shortcuts.hide_all': 'Hide all layers',
    'ui_comparator.shortcuts.drag_to_move': 'Drag to move layer position',
    
    // Dialogs
    'dialog.delete.title': 'Delete Layer',
    'dialog.delete.description': 'This action cannot be undone. Are you sure you want to continue?',
    'dialog.delete.confirm': 'Delete Layer',
    
    'dialog.clear_all.title': 'Clear All Layers',
    'dialog.clear_all.description': 'This action cannot be undone. Are you sure you want to continue?',
    'dialog.clear_all.confirm': 'Clear All Layers',
    
    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    
    // Toast Messages
    'toast.layer_deleted': 'Layer deleted successfully',
    'toast.layers_cleared': 'All layers cleared',
    'toast.layer_toggled_visible': 'Layer shown',
    'toast.layer_toggled_hidden': 'Layer hidden',
    'toast.layer_locked': 'Layer locked',
    'toast.layer_unlocked': 'Layer unlocked',
    'toast.all_layers_visible': 'All layers shown',
    'toast.all_layers_hidden': 'All layers hidden',
    'toast.browser_size_adjusted': 'Browser size adjusted to',
    'toast.operation_failed': 'Operation failed',
  } as I18nKeys,
};

export type Language = keyof typeof translations;

export const getTranslation = (language: Language, key: keyof I18nKeys): string => {
  return translations[language][key] || translations.zh[key] || key;
};