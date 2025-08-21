export interface I18nKeys {
  // Common
  "common.cancel": string;
  "common.confirm": string;
  "common.delete": string;
  "common.save": string;
  "common.close": string;
  "common.loading": string;

  // App Header
  "app.title": string;
  "app.theme.light": string;
  "app.theme.dark": string;
  "app.language.switch_to_english": string;
  "app.language.switch_to_chinese": string;

  // Tabs
  "tabs.ui_comparator": string;
  "tabs.viewport_simulator": string;
  "tabs.settings": string;

  // UI Comparator
  "ui_comparator.upload.title": string;
  "ui_comparator.upload.description": string;
  "ui_comparator.upload.success": string;
  "ui_comparator.upload.error": string;

  "ui_comparator.browser_size.title": string;
  "ui_comparator.browser_size_hint.title": string;
  "ui_comparator.browser_size_hint.description": string;
  "ui_comparator.browser_size_hint.tip": string;

  "ui_comparator.layers.title": string;
  "ui_comparator.layers.empty": string;
  "ui_comparator.layers.clear_all": string;

  "ui_comparator.shortcuts.title": string;
  "ui_comparator.shortcuts.toggle_all": string;
  "ui_comparator.shortcuts.hide_all": string;
  "ui_comparator.shortcuts.drag_to_move": string;

  // Viewport Simulator
  "viewport_simulator.title": string;
  "viewport_simulator.description": string;
  "viewport_simulator_control.title": string;
  "viewport_simulator_control.description": string;
  "viewport_simulator_control.status_enabled": string;
  "viewport_simulator_control.status_disabled": string;
  "viewport_simulator_control.select_device": string;
  "viewport_simulator_control.choose_device": string;
  "viewport_simulator_control.enabled": string;
  "viewport_simulator_control.disabled": string;
  "viewport_simulator_control.enable_failed": string;
  "viewport_simulator_control.disable_failed": string;
  "viewport_simulator_control.invalid_device": string;
  "viewport_simulator_control.device_switched": string;
  "viewport_simulator_control.operation_failed": string;
  "viewport_simulator_control.instructions.line1": string;
  "viewport_simulator_control.instructions.step1": string;
  "viewport_simulator_control.instructions.step2": string;
  "viewport_simulator_control.instructions.step3": string;
  "viewport_simulator.orientation": string;
  "viewport_simulator.portrait": string;
  "viewport_simulator.landscape": string;
  "viewport_simulator.coffee_mode": string;
  "viewport_simulator.active": string;
  "viewport_simulator.popular": string;
  "viewport_simulator.desktop": string;
  "viewport_simulator.custom_size": string;
  "viewport_simulator.width": string;
  "viewport_simulator.height": string;
  "viewport_simulator.apply_custom_size": string;
  "viewport_simulator.quick_actions": string;
  "viewport_simulator.switched_to": string;
  "viewport_simulator.switch_failed": string;
  "viewport_simulator.custom_size_applied": string;
  "viewport_simulator.custom_size_failed": string;
  "viewport_simulator.invalid_width": string;
  "viewport_simulator.invalid_height": string;

  // Dialogs
  "dialog.delete.title": string;
  "dialog.delete.description": string;
  "dialog.delete.confirm": string;

  "dialog.clear_all.title": string;
  "dialog.clear_all.description": string;
  "dialog.clear_all.confirm": string;

  // Settings
  "settings.title": string;
  "settings.theme": string;
  "settings.language": string;

  // Toast Messages
  "toast.layer_deleted": string;
  "toast.layers_cleared": string;
  "toast.layer_toggled_visible": string;
  "toast.layer_toggled_hidden": string;
  "toast.layer_locked": string;
  "toast.layer_unlocked": string;
  "toast.all_layers_visible": string;
  "toast.all_layers_hidden": string;
  "toast.browser_size_adjusted": string;
  "toast.operation_failed": string;
  "toast.theme_saved": string;
  "toast.theme_failed": string;
  "toast.language_saved": string;
  "toast.language_failed": string;
  "toast.shortcut_saved": string;
  "toast.shortcut_failed": string;
  "toast.config_exported": string;
  "toast.config_export_failed": string;
  "toast.config_imported": string;
  "toast.config_import_failed": string;
  "toast.settings_reset": string;
  "toast.settings_reset_failed": string;
  "toast.storage_info": string;
  "toast.storage_info_failed": string;

  // Errors
  "error.no_page_info": string;
  "error.need_refresh": string;
  "error.unsupported_page": string;
  "error.create_layer_failed": string;
  "error.update_layer_failed": string;
  "error.delete_layer_failed": string;
  "error.size_adjust_failed": string;

  // Content Script
  "content.toggle_all_layers": string;
  "content.freeze_unfreeze_layers": string;
  "content.delete_all_layers": string;
  "content.opacity": string;
  "content.no_layers": string;
  "content.layers_count": string;
  "content.layer": string;
  "content.visible": string;
  "content.hidden": string;

  // Settings Panel
  "settings.shortcuts": string;
  "settings.toggle_ui_comparison": string;
  "settings.shortcut_placeholder": string;
  "settings.data_management": string;
  "settings.export_config": string;
  "settings.export_config_desc": string;
  "settings.export": string;
  "settings.import_config": string;
  "settings.import_config_desc": string;
  "settings.import": string;
  "settings.storage_usage": string;
  "settings.storage_usage_desc": string;
  "settings.view": string;
  "settings.danger_zone": string;
  "settings.reset_settings": string;
  "settings.reset_settings_desc": string;
  "settings.reset": string;
  "settings.about": string;
  "settings.version": string;
  "settings.description": string;
  "settings.features": string;
  "settings.feature_ui_compare": string;
  "settings.feature_browser_size": string;
  "settings.feature_layer_management": string;
  "settings.feature_responsive": string;
  "settings.reset_confirm_title": string;
  "settings.reset_confirm_desc": string;

  // UI Comparator
  "ui_comparator.no_page_info": string;
  "ui_comparator.formats": string;
  "ui_comparator.no_layers": string;
  "ui_comparator.hide_all": string;
  "ui_comparator.drag_to_move": string;
  "ui_comparator.layer_prefix": string;
  "ui_comparator.hide_layer": string;
  "ui_comparator.show_layer": string;
  "ui_comparator.lock_layer": string;
  "ui_comparator.unlock_layer": string;
  "ui_comparator.delete_layer": string;
  "ui_comparator.visible": string;
  "ui_comparator.hidden": string;
  "ui_comparator.locked": string;
  "ui_comparator.movable": string;
  "ui_comparator.opacity": string;
  "ui_comparator.position": string;
  "ui_comparator.size": string;
  "ui_comparator.screen_limited": string;
}

export const translations = {
  zh: {
    // Common
    "common.cancel": "取消",
    "common.confirm": "确认",
    "common.delete": "删除",
    "common.save": "保存",
    "common.close": "关闭",
    "common.loading": "加载中...",

    // App Header
    "app.title": "Frontend Dev Tools",
    "app.theme.light": "切换到深色模式",
    "app.theme.dark": "切换到浅色模式",
    "app.language.switch_to_english": "Switch to English",
    "app.language.switch_to_chinese": "切换到中文",

    // Tabs
    "tabs.ui_comparator": "样式对比",
    "tabs.viewport_simulator": "视口模拟器",
    "tabs.settings": "设置",

    // UI Comparator
    "ui_comparator.upload.title": "上传 UI 设计稿",
    "ui_comparator.upload.description": "支持格式：",
    "ui_comparator.upload.success": "UI图片上传成功，窗口宽度已调整为",
    "ui_comparator.upload.error": "上传失败",

    "ui_comparator.browser_size.title": "浏览器尺寸",
    "ui_comparator.browser_size_hint.title": "浏览器尺寸调整",
    "ui_comparator.browser_size_hint.description": "浏览器尺寸调整功能已移至视口模拟器",
    "ui_comparator.browser_size_hint.tip": "切换到「视口模拟器」标签页体验全新的设备模拟功能",

    "ui_comparator.layers.title": "图层管理",
    "ui_comparator.layers.empty": "暂无图层",
    "ui_comparator.layers.clear_all": "清除",

    "ui_comparator.shortcuts.title": "快捷键",
    "ui_comparator.shortcuts.toggle_all": "切换所有图层",
    "ui_comparator.shortcuts.hide_all": "隐藏所有图层",
    "ui_comparator.shortcuts.drag_to_move": "拖拽移动图层位置",

    // Viewport Simulator
    "viewport_simulator.title": "视口模拟器",
    "viewport_simulator.description": "终极设备模拟器和网站测试工具",
    "viewport_simulator_control.title": "视口模拟器",
    "viewport_simulator_control.description": "启用后将在页面中显示真实设备外观",
    "viewport_simulator_control.status_enabled": "已启用",
    "viewport_simulator_control.status_disabled": "已禁用",
    "viewport_simulator_control.select_device": "选择设备",
    "viewport_simulator_control.choose_device": "选择设备型号",
    "viewport_simulator_control.enabled": "视口模拟器已启用",
    "viewport_simulator_control.disabled": "视口模拟器已禁用",
    "viewport_simulator_control.enable_failed": "启用视口模拟器失败",
    "viewport_simulator_control.disable_failed": "禁用视口模拟器失败",
    "viewport_simulator_control.invalid_device": "无效的设备类型",
    "viewport_simulator_control.device_switched": "设备已切换至",
    "viewport_simulator_control.operation_failed": "操作失败",
    "viewport_simulator_control.instructions.line1": "如何使用视口模拟器：",
    "viewport_simulator_control.instructions.step1": "开启开关启用设备模拟",
    "viewport_simulator_control.instructions.step2": "选择要模拟的设备型号",
    "viewport_simulator_control.instructions.step3": "页面将显示真实设备外观",
    "viewport_simulator.orientation": "方向",
    "viewport_simulator.portrait": "竖屏",
    "viewport_simulator.landscape": "横屏",
    "viewport_simulator.coffee_mode": "咖啡模式",
    "viewport_simulator.active": "激活中",
    "viewport_simulator.popular": "热门",
    "viewport_simulator.desktop": "桌面",
    "viewport_simulator.custom_size": "自定义尺寸",
    "viewport_simulator.width": "宽度",
    "viewport_simulator.height": "高度",
    "viewport_simulator.apply_custom_size": "应用自定义尺寸",
    "viewport_simulator.quick_actions": "快捷操作",
    "viewport_simulator.switched_to": "已切换到",
    "viewport_simulator.switch_failed": "切换失败",
    "viewport_simulator.custom_size_applied": "自定义尺寸已应用：",
    "viewport_simulator.custom_size_failed": "自定义尺寸应用失败",
    "viewport_simulator.invalid_width": "宽度必须为100-4000像素",
    "viewport_simulator.invalid_height": "高度必须为100-4000像素",

    // Dialogs
    "dialog.delete.title": "删除图层",
    "dialog.delete.description": "这个操作无法撤销，确定要继续吗？",
    "dialog.delete.confirm": "删除图层",

    "dialog.clear_all.title": "清除所有图层",
    "dialog.clear_all.description": "这个操作无法撤销，确定要继续吗？",
    "dialog.clear_all.confirm": "清除所有图层",

    // Settings
    "settings.title": "设置",
    "settings.theme": "主题",
    "settings.language": "语言",

    // Toast Messages
    "toast.layer_deleted": "图层删除成功",
    "toast.layers_cleared": "所有图层已清除",
    "toast.layer_toggled_visible": "图层已显示",
    "toast.layer_toggled_hidden": "图层已隐藏",
    "toast.layer_locked": "图层已锁定",
    "toast.layer_unlocked": "图层已解锁",
    "toast.all_layers_visible": "所有图层已显示",
    "toast.all_layers_hidden": "所有图层已隐藏",
    "toast.browser_size_adjusted": "浏览器尺寸已调整为",
    "toast.operation_failed": "操作失败",
    "toast.theme_saved": "主题设置已保存",
    "toast.theme_failed": "主题设置失败",
    "toast.language_saved": "语言设置已保存",
    "toast.language_failed": "语言设置失败",
    "toast.shortcut_saved": "快捷键设置已保存",
    "toast.shortcut_failed": "快捷键设置失败",
    "toast.config_exported": "配置导出成功",
    "toast.config_export_failed": "配置导出失败",
    "toast.config_imported": "配置导入成功，请刷新扩展",
    "toast.config_import_failed": "配置导入失败：数据格式错误",
    "toast.settings_reset": "设置已重置，请刷新扩展",
    "toast.settings_reset_failed": "设置重置失败",
    "toast.storage_info": "存储使用情况",
    "toast.storage_info_failed": "获取存储信息失败",

    // Errors
    "error.no_page_info": "无法获取当前页面信息",
    "error.need_refresh": "插件需要页面刷新才能正常工作。请刷新页面后重试。",
    "error.unsupported_page": "此页面不支持UI比对功能（浏览器内部页面）",
    "error.create_layer_failed": "创建图层失败",
    "error.update_layer_failed": "更新图层失败",
    "error.delete_layer_failed": "删除图层失败",
    "error.size_adjust_failed": "尺寸调整失败",

    // Content Script
    "content.toggle_all_layers": "切换所有图层",
    "content.freeze_unfreeze_layers": "冻结/解冻所有图层",
    "content.delete_all_layers": "删除所有图层",
    "content.opacity": "透明度",
    "content.no_layers": "暂无图层",
    "content.layers_count": "层",
    "content.layer": "图层",
    "content.visible": "显示中",
    "content.hidden": "隐藏",

    // Settings Panel
    "settings.shortcuts": "快捷键设置",
    "settings.toggle_ui_comparison": "切换UI比对",
    "settings.shortcut_placeholder": "例如: Ctrl+Shift+U",
    "settings.data_management": "数据管理",
    "settings.export_config": "导出配置",
    "settings.export_config_desc": "导出当前所有设置和配置到JSON文件",
    "settings.export": "导出",
    "settings.import_config": "导入配置",
    "settings.import_config_desc": "从JSON文件导入设置和配置",
    "settings.import": "导入",
    "settings.storage_usage": "存储使用情况",
    "settings.storage_usage_desc": "查看扩展程序的存储使用情况",
    "settings.view": "查看",
    "settings.danger_zone": "危险操作",
    "settings.reset_settings": "重置所有设置",
    "settings.reset_settings_desc": "这将清除所有配置数据，包括UI图层和扩展设置",
    "settings.reset": "重置设置",
    "settings.about": "关于",
    "settings.version": "版本",
    "settings.description": "专为前端开发者设计的Chrome扩展工具",
    "settings.features": "功能特性：",
    "settings.feature_ui_compare": "UI设计稿像素级比对",
    "settings.feature_browser_size": "浏览器尺寸快速调整",
    "settings.feature_layer_management": "图层管理和控制",
    "settings.feature_responsive": "响应式设计辅助",
    "settings.reset_confirm_title": "确认重置",
    "settings.reset_confirm_desc": "这将清除所有配置数据，包括UI图层和扩展设置。此操作不可撤销。",

    // UI Comparator
    "ui_comparator.no_page_info": "无法获取当前页面信息",
    "ui_comparator.formats": "支持格式：",
    "ui_comparator.no_layers": "暂无UI图层",
    "ui_comparator.hide_all": "隐藏所有图层",
    "ui_comparator.drag_to_move": "拖拽移动图层位置",
    "ui_comparator.layer_prefix": "图层",
    "ui_comparator.hide_layer": "隐藏图层",
    "ui_comparator.show_layer": "显示图层",
    "ui_comparator.lock_layer": "锁定图层",
    "ui_comparator.unlock_layer": "解锁图层",
    "ui_comparator.delete_layer": "删除图层",
    "ui_comparator.visible": "显示",
    "ui_comparator.hidden": "隐藏",
    "ui_comparator.locked": "已锁定",
    "ui_comparator.movable": "可移动",
    "ui_comparator.opacity": "透明度",
    "ui_comparator.position": "位置",
    "ui_comparator.size": "尺寸",
    "ui_comparator.screen_limited": "受屏幕尺寸限制",
  } as I18nKeys,

  en: {
    // Common
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.close": "Close",
    "common.loading": "Loading...",

    // App Header
    "app.title": "Frontend Dev Tools",
    "app.theme.light": "Switch to dark mode",
    "app.theme.dark": "Switch to light mode",
    "app.language.switch_to_english": "Switch to English",
    "app.language.switch_to_chinese": "切换到中文",

    // Tabs
    "tabs.ui_comparator": "Style Checker",
    "tabs.viewport_simulator": "Viewport Simulator",
    "tabs.settings": "Settings",

    // UI Comparator
    "ui_comparator.upload.title": "Upload UI Design",
    "ui_comparator.upload.description": "Supported formats: ",
    "ui_comparator.upload.success": "UI image uploaded successfully, window width adjusted to",
    "ui_comparator.upload.error": "Upload failed",

    "ui_comparator.browser_size.title": "Browser Size",
    "ui_comparator.browser_size_hint.title": "Browser Size Adjustment",
    "ui_comparator.browser_size_hint.description": "Browser size adjustment has been moved to Viewport Simulator",
    "ui_comparator.browser_size_hint.tip": "Switch to 'Viewport Simulator' tab to experience the new device simulation features",

    "ui_comparator.layers.title": "Layer Management",
    "ui_comparator.layers.empty": "No layers",
    "ui_comparator.layers.clear_all": "Clear",

    "ui_comparator.shortcuts.title": "Shortcuts",
    "ui_comparator.shortcuts.toggle_all": "Toggle all layers",
    "ui_comparator.shortcuts.hide_all": "Hide all layers",
    "ui_comparator.shortcuts.drag_to_move": "Drag to move layer position",

    // Viewport Simulator
    "viewport_simulator.title": "Viewport Simulator",
    "viewport_simulator.description": "Ultimate device emulator and website testing tool",
    "viewport_simulator_control.title": "Viewport Simulator",
    "viewport_simulator_control.description": "When enabled, shows real device appearance on the page",
    "viewport_simulator_control.status_enabled": "Enabled",
    "viewport_simulator_control.status_disabled": "Disabled",
    "viewport_simulator_control.select_device": "Select Device",
    "viewport_simulator_control.choose_device": "Choose device model",
    "viewport_simulator_control.enabled": "Viewport simulator enabled",
    "viewport_simulator_control.disabled": "Viewport simulator disabled",
    "viewport_simulator_control.enable_failed": "Failed to enable viewport simulator",
    "viewport_simulator_control.disable_failed": "Failed to disable viewport simulator",
    "viewport_simulator_control.invalid_device": "Invalid device type",
    "viewport_simulator_control.device_switched": "Device switched to",
    "viewport_simulator_control.operation_failed": "Operation failed",
    "viewport_simulator_control.instructions.line1": "How to use the viewport simulator:",
    "viewport_simulator_control.instructions.step1": "Toggle switch to enable device simulation",
    "viewport_simulator_control.instructions.step2": "Select device model to simulate",
    "viewport_simulator_control.instructions.step3": "Page will show real device appearance",
    "viewport_simulator.orientation": "Orientation",
    "viewport_simulator.portrait": "Portrait",
    "viewport_simulator.landscape": "Landscape",
    "viewport_simulator.coffee_mode": "Coffee Mode",
    "viewport_simulator.active": "Active",
    "viewport_simulator.popular": "Popular",
    "viewport_simulator.desktop": "Desktop",
    "viewport_simulator.custom_size": "Custom Size",
    "viewport_simulator.width": "Width",
    "viewport_simulator.height": "Height",
    "viewport_simulator.apply_custom_size": "Apply Custom Size",
    "viewport_simulator.quick_actions": "Quick Actions",
    "viewport_simulator.switched_to": "Switched to",
    "viewport_simulator.switch_failed": "Switch failed",
    "viewport_simulator.custom_size_applied": "Custom size applied:",
    "viewport_simulator.custom_size_failed": "Custom size application failed",
    "viewport_simulator.invalid_width": "Width must be between 100-4000 pixels",
    "viewport_simulator.invalid_height": "Height must be between 100-4000 pixels",

    // Dialogs
    "dialog.delete.title": "Delete Layer",
    "dialog.delete.description": "This action cannot be undone. Are you sure you want to continue?",
    "dialog.delete.confirm": "Delete Layer",

    "dialog.clear_all.title": "Clear All Layers",
    "dialog.clear_all.description":
      "This action cannot be undone. Are you sure you want to continue?",
    "dialog.clear_all.confirm": "Clear All Layers",

    // Settings
    "settings.title": "Settings",
    "settings.theme": "Theme",
    "settings.language": "Language",

    // Toast Messages
    "toast.layer_deleted": "Layer deleted successfully",
    "toast.layers_cleared": "All layers cleared",
    "toast.layer_toggled_visible": "Layer shown",
    "toast.layer_toggled_hidden": "Layer hidden",
    "toast.layer_locked": "Layer locked",
    "toast.layer_unlocked": "Layer unlocked",
    "toast.all_layers_visible": "All layers shown",
    "toast.all_layers_hidden": "All layers hidden",
    "toast.browser_size_adjusted": "Browser size adjusted to",
    "toast.operation_failed": "Operation failed",
    "toast.theme_saved": "Theme settings saved",
    "toast.theme_failed": "Theme settings failed",
    "toast.language_saved": "Language settings saved", 
    "toast.language_failed": "Language settings failed",
    "toast.shortcut_saved": "Shortcut settings saved",
    "toast.shortcut_failed": "Shortcut settings failed",
    "toast.config_exported": "Configuration exported successfully",
    "toast.config_export_failed": "Configuration export failed",
    "toast.config_imported": "Configuration imported successfully, please refresh extension",
    "toast.config_import_failed": "Configuration import failed: invalid data format",
    "toast.settings_reset": "Settings reset, please refresh extension",
    "toast.settings_reset_failed": "Settings reset failed",
    "toast.storage_info": "Storage usage",
    "toast.storage_info_failed": "Failed to get storage info",

    // Errors
    "error.no_active_tab": "No active tab found",
    "error.content_script_injection_failed": "Failed to inject content script",
    "error.no_page_info": "Unable to get current page information",
    "error.need_refresh": "Plugin needs page refresh to work properly. Please refresh the page and try again.",
    "error.unsupported_page": "This page does not support UI comparison functionality (browser internal page)",
    "error.create_layer_failed": "Failed to create layer",
    "error.update_layer_failed": "Failed to update layer",
    "error.delete_layer_failed": "Failed to delete layer",
    "error.size_adjust_failed": "Size adjustment failed",

    // Content Script
    "content.toggle_all_layers": "Toggle all layers",
    "content.freeze_unfreeze_layers": "Freeze/unfreeze all layers",
    "content.delete_all_layers": "Delete all layers",
    "content.opacity": "Opacity",
    "content.no_layers": "No layers",
    "content.layers_count": "layers",
    "content.layer": "Layer",
    "content.visible": "Visible",
    "content.hidden": "Hidden",

    // Settings Panel
    "settings.shortcuts": "Shortcut Settings",
    "settings.toggle_ui_comparison": "Toggle UI Comparison",
    "settings.shortcut_placeholder": "e.g.: Ctrl+Shift+U",
    "settings.data_management": "Data Management",
    "settings.export_config": "Export Configuration",
    "settings.export_config_desc": "Export all current settings and configurations to JSON file",
    "settings.export": "Export",
    "settings.import_config": "Import Configuration",
    "settings.import_config_desc": "Import settings and configurations from JSON file",
    "settings.import": "Import",
    "settings.storage_usage": "Storage Usage",
    "settings.storage_usage_desc": "View extension storage usage",
    "settings.view": "View",
    "settings.danger_zone": "Danger Zone",
    "settings.reset_settings": "Reset All Settings",
    "settings.reset_settings_desc": "This will clear all configuration data, including UI layers and extension settings",
    "settings.reset": "Reset Settings",
    "settings.about": "About",
    "settings.version": "Version",
    "settings.description": "Chrome extension tool designed for frontend developers",
    "settings.features": "Features:",
    "settings.feature_ui_compare": "Pixel-perfect UI design comparison",
    "settings.feature_browser_size": "Quick browser size adjustment", 
    "settings.feature_layer_management": "Layer management and control",
    "settings.feature_responsive": "Responsive design assistance",
    "settings.reset_confirm_title": "Confirm Reset",
    "settings.reset_confirm_desc": "This will clear all configuration data, including UI layers and extension settings. This action cannot be undone.",

    // UI Comparator
    "ui_comparator.no_page_info": "Unable to get current page information",
    "ui_comparator.formats": "Supported formats: ",
    "ui_comparator.no_layers": "No UI layers",
    "ui_comparator.hide_all": "Hide all layers",
    "ui_comparator.drag_to_move": "Drag to move layer position",
    "ui_comparator.layer_prefix": "Layer",
    "ui_comparator.hide_layer": "Hide layer",
    "ui_comparator.show_layer": "Show layer",
    "ui_comparator.lock_layer": "Lock layer",
    "ui_comparator.unlock_layer": "Unlock layer",
    "ui_comparator.delete_layer": "Delete layer",
    "ui_comparator.visible": "Visible",
    "ui_comparator.hidden": "Hidden",
    "ui_comparator.locked": "Locked",
    "ui_comparator.movable": "Movable",
    "ui_comparator.opacity": "Opacity",
    "ui_comparator.position": "Position",
    "ui_comparator.size": "Size",
    "ui_comparator.screen_limited": "limited by screen size",
  } as I18nKeys,
};

export type Language = keyof typeof translations;

export const getTranslation = (language: Language, key: keyof I18nKeys): string => {
  return translations[language][key] || translations.zh[key] || key;
};
