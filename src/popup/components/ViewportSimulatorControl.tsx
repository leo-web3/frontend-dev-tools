import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { POPULAR_DEVICES, getDeviceById } from "@/shared/deviceDatabase";
import { Smartphone } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useI18n } from "../hooks/useI18n";

export const ViewportSimulatorControl: React.FC = () => {
  const { t } = useI18n();
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(POPULAR_DEVICES[0]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Check if simulator is currently enabled
    checkSimulatorStatus();
  }, []);

  const checkSimulatorStatus = async () => {
    try {
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      if (response[0]?.id) {
        const result = await chrome.runtime.sendMessage({
          type: "GET_SIMULATOR_STATUS",
          tabId: response[0].id
        });
        if (result?.success && result.data?.enabled) {
          setIsEnabled(true);
          if (result.data.currentDevice) {
            setSelectedDevice(result.data.currentDevice.id);
          }
        }
      }
    } catch (error) {
      // Simulator not available or not enabled
    }
  };

  const handleToggleSimulator = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        showToast(t("error.no_active_tab"), "error");
        return;
      }

      if (isEnabled) {
        // Disable simulator
        const response = await chrome.runtime.sendMessage({
          type: "DISABLE_VIEWPORT_SIMULATOR",
          tabId: tab.id
        });
        
        if (response?.success) {
          setIsEnabled(false);
          showToast(t("viewport_simulator_control.disabled"), "success");
        } else {
          showToast(t("viewport_simulator_control.disable_failed"), "error");
        }
      } else {
        // Enable simulator
        const device = getDeviceById(selectedDevice);
        if (!device) {
          showToast(t("viewport_simulator_control.invalid_device"), "error");
          return;
        }

        const response = await chrome.runtime.sendMessage({
          type: "ENABLE_VIEWPORT_SIMULATOR",
          payload: { deviceId: selectedDevice },
          tabId: tab.id
        });

        if (response?.success) {
          setIsEnabled(true);
          showToast(t("viewport_simulator_control.enabled") + ` ${device.name}`, "success");
        } else {
          // Try to inject content script if not available
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"]
            });
            
            // Try again after injection
            setTimeout(async () => {
              const retryResponse = await chrome.runtime.sendMessage({
                type: "ENABLE_VIEWPORT_SIMULATOR",
                payload: { deviceId: selectedDevice },
                tabId: tab.id
              });
              
              if (retryResponse?.success) {
                setIsEnabled(true);
                showToast(t("viewport_simulator_control.enabled") + ` ${device.name}`, "success");
              } else {
                showToast(t("viewport_simulator_control.enable_failed"), "error");
              }
            }, 1000);
          } catch (injectionError) {
            showToast(t("error.content_script_injection_failed"), "error");
          }
        }
      }
    } catch (error) {
      showToast(t("viewport_simulator_control.operation_failed"), "error");
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    
    if (isEnabled) {
      // Switch device if simulator is active
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          const response = await chrome.runtime.sendMessage({
            type: "SWITCH_DEVICE",
            payload: { deviceId },
            tabId: tab.id
          });
          
          const device = getDeviceById(deviceId);
          if (response?.success && device) {
            showToast(t("viewport_simulator_control.device_switched") + ` ${device.name}`, "success");
          }
        }
      } catch (error) {
        console.error("Failed to switch device:", error);
      }
    }
  };

  const deviceOptions = POPULAR_DEVICES.map(deviceId => {
    const device = getDeviceById(deviceId);
    return device ? {
      id: deviceId,
      name: device.name,
      dimensions: `${device.viewport.width}×${device.viewport.height}`,
      category: device.category
    } : null;
  }).filter(Boolean);

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            toast.type === "success"
              ? "bg-green-500/90 text-white border-green-400/50"
              : "bg-red-500/90 text-white border-red-400/50"
          } transition-all duration-300`}
        >
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{t("viewport_simulator_control.title")}</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  {t("viewport_simulator_control.description")}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isEnabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                {isEnabled ? t("viewport_simulator_control.status_enabled") : t("viewport_simulator_control.status_disabled")}
              </span>
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggleSimulator}
              />
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Device Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              {t("viewport_simulator_control.select_device")}
            </label>
            
            <Select value={selectedDevice} onValueChange={handleDeviceChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("viewport_simulator_control.choose_device")} />
              </SelectTrigger>
              <SelectContent>
                {deviceOptions.map((device) => (
                  <SelectItem key={device!.id} value={device!.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{device!.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {device!.dimensions}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs">💡</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">{t("viewport_simulator_control.instructions.line1")}</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>{t("viewport_simulator_control.instructions.step1")}</li>
                  <li>{t("viewport_simulator_control.instructions.step2")}</li>
                  <li>{t("viewport_simulator_control.instructions.step3")}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {isEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeviceChange('iphone-15-pro')}
                className="h-auto p-3 flex flex-col gap-1 border border-border/50 rounded-xl hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="text-xs font-medium">iPhone 15 Pro</span>
                <span className="text-xs text-muted-foreground">393×852</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeviceChange('ipad-pro-11-m2')}
                className="h-auto p-3 flex flex-col gap-1 border border-border/50 rounded-xl hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="text-xs font-medium">iPad Pro</span>
                <span className="text-xs text-muted-foreground">834×1194</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};