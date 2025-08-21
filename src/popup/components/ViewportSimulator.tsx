import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DEVICE_DATABASE, 
  getDevicesByBrand, 
  getDevicesByCategory, 
  getDeviceById, 
  POPULAR_DEVICES,
  COFFEE_MODE_DEVICES,
  type DeviceSpec 
} from "@/shared/deviceDatabase";
import { 
  Coffee, 
  Monitor, 
  RotateCcw, 
  Settings2, 
  Smartphone, 
  Tablet, 
  Watch 
} from "lucide-react";
import React, { useState } from "react";
import { useI18n } from "../hooks/useI18n";

interface ViewportSimulatorProps {
  onAdjustViewport?: (width: number, height: number | null, device?: DeviceSpec) => void;
}

export const ViewportSimulator: React.FC<ViewportSimulatorProps> = ({
  onAdjustViewport
}) => {
  const { t } = useI18n();
  
  const [selectedDevice, setSelectedDevice] = useState<DeviceSpec | null>(null);
  const [customWidth, setCustomWidth] = useState<string>("1440");
  const [customHeight, setCustomHeight] = useState<string>("900");
  const [coffeeMode, setCoffeeMode] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [activeTab, setActiveTab] = useState<string>("popular");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeviceSelect = async (device: DeviceSpec) => {
    setSelectedDevice(device);
    
    // Apply orientation adjustments
    let { width, height } = device.viewport;
    if (orientation === 'landscape' && width < height) {
      [width, height] = [height, width];
    } else if (orientation === 'portrait' && width > height) {
      [width, height] = [height, width];
    }

    try {
      if (onAdjustViewport) {
        await onAdjustViewport(width, height, device);
        showToast(
          `${t("viewport_simulator.switched_to")} ${device.name} (${width}×${height})`,
          "success"
        );
      }
    } catch (error) {
      showToast(t("viewport_simulator.switch_failed"), "error");
    }
  };

  const handleCustomResize = async () => {
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);

    if (!width || width < 100 || width > 4000) {
      showToast(t("viewport_simulator.invalid_width"), "error");
      return;
    }

    if (!height || height < 100 || height > 4000) {
      showToast(t("viewport_simulator.invalid_height"), "error");
      return;
    }

    try {
      if (onAdjustViewport) {
        await onAdjustViewport(width, height);
        showToast(
          `${t("viewport_simulator.custom_size_applied")} ${width}×${height}`,
          "success"
        );
      }
    } catch (error) {
      showToast(t("viewport_simulator.custom_size_failed"), "error");
    }
  };

  const handleOrientationToggle = () => {
    const newOrientation = orientation === 'portrait' ? 'landscape' : 'portrait';
    setOrientation(newOrientation);
    
    if (selectedDevice) {
      handleDeviceSelect(selectedDevice);
    }
  };

  const renderDeviceCard = (device: DeviceSpec) => {
    const isSelected = selectedDevice?.id === device.id;
    let { width, height } = device.viewport;
    
    // Apply orientation
    if (orientation === 'landscape' && width < height) {
      [width, height] = [height, width];
    } else if (orientation === 'portrait' && width > height) {
      [width, height] = [height, width];
    }

    return (
      <Card
        key={device.id}
        className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
          isSelected 
            ? "border-primary bg-primary/10 shadow-lg" 
            : "border-border/50 hover:border-primary/50"
        }`}
        onClick={() => handleDeviceSelect(device)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {device.category === 'mobile' && <Smartphone className="w-4 h-4 text-primary" />}
                {device.category === 'tablet' && <Tablet className="w-4 h-4 text-primary" />}
                {device.category === 'watch' && <Watch className="w-4 h-4 text-primary" />}
                {(device.category === 'desktop' || device.category === 'laptop') && 
                  <Monitor className="w-4 h-4 text-primary" />}
                <h4 className="font-semibold text-sm">{device.name}</h4>
              </div>
              
              <div className="text-xs text-muted-foreground mb-2">
                {width} × {height}
              </div>
              
              {device.features && device.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {device.features.slice(0, 2).map((feature) => (
                    <span 
                      key={feature}
                      className="text-xs px-2 py-1 bg-muted rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {coffeeMode && COFFEE_MODE_DEVICES.includes(device.id) && (
              <Coffee className="w-4 h-4 text-orange-500" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getFilteredDevices = () => {
    if (coffeeMode) {
      return COFFEE_MODE_DEVICES.map(id => getDeviceById(id)!).filter(Boolean);
    }

    switch (activeTab) {
      case "popular":
        return POPULAR_DEVICES.map(id => getDeviceById(id)!).filter(Boolean);
      case "iphone":
        return getDevicesByBrand("iPhone");
      case "ipad":
        return getDevicesByBrand("iPad");
      case "iwatch":
        return getDevicesByBrand("iWatch");
      case "samsung":
        return getDevicesByBrand("Samsung");
      case "google":
        return getDevicesByBrand("Google");
      case "xiaomi":
        return getDevicesByBrand("Xiaomi");
      case "desktop":
        return getDevicesByCategory("desktop").concat(getDevicesByCategory("laptop"));
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Header Controls */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("viewport_simulator.title")}</h2>
                <p className="text-sm text-muted-foreground font-normal">
                  {t("viewport_simulator.description")}
                </p>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Control Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Orientation Toggle */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">{t("viewport_simulator.orientation")}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOrientationToggle}
                className="flex items-center gap-2 rounded-xl border border-border/50 hover:border-primary/50"
              >
                <RotateCcw className="w-4 h-4" />
                {orientation === 'portrait' ? t("viewport_simulator.portrait") : t("viewport_simulator.landscape")}
              </Button>
            </div>

            {/* Coffee Mode */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">{t("viewport_simulator.coffee_mode")}</Label>
              <Switch
                checked={coffeeMode}
                onCheckedChange={setCoffeeMode}
              />
            </div>
          </div>

          {/* Selected Device Info */}
          {selectedDevice && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-primary">{selectedDevice.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {orientation === 'landscape' && selectedDevice.viewport.width < selectedDevice.viewport.height
                      ? `${selectedDevice.viewport.height} × ${selectedDevice.viewport.width}`
                      : orientation === 'portrait' && selectedDevice.viewport.width > selectedDevice.viewport.height
                      ? `${selectedDevice.viewport.height} × ${selectedDevice.viewport.width}`
                      : `${selectedDevice.viewport.width} × ${selectedDevice.viewport.height}`
                    } • DPR: {selectedDevice.devicePixelRatio}
                  </p>
                </div>
                <div className="text-xs text-primary font-medium px-3 py-1 bg-primary/10 rounded-full">
                  {t("viewport_simulator.active")}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Selection */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-xl">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
              <TabsTrigger value="popular" className="text-xs">
                {t("viewport_simulator.popular")}
              </TabsTrigger>
              <TabsTrigger value="iphone" className="text-xs">iPhone</TabsTrigger>
              <TabsTrigger value="ipad" className="text-xs">iPad</TabsTrigger>
              <TabsTrigger value="iwatch" className="text-xs">Watch</TabsTrigger>
              <TabsTrigger value="samsung" className="text-xs">Samsung</TabsTrigger>
              <TabsTrigger value="google" className="text-xs">Google</TabsTrigger>
              <TabsTrigger value="xiaomi" className="text-xs">Xiaomi</TabsTrigger>
              <TabsTrigger value="desktop" className="text-xs">
                {t("viewport_simulator.desktop")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredDevices().map(renderDeviceCard)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Custom Size Input */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-primary" />
            {t("viewport_simulator.custom_size")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom-width" className="text-sm font-medium">
                {t("viewport_simulator.width")} (px)
              </Label>
              <Input
                id="custom-width"
                type="number"
                min="100"
                max="4000"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="custom-height" className="text-sm font-medium">
                {t("viewport_simulator.height")} (px)
              </Label>
              <Input
                id="custom-height"
                type="number"
                min="100"
                max="4000"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleCustomResize}
            className="w-full rounded-xl h-12 font-medium"
          >
            {t("viewport_simulator.apply_custom_size")}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">{t("viewport_simulator.quick_actions")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "iPhone 15 Pro", width: 393, height: 852 },
              { name: "iPad Pro", width: 1024, height: 1366 },
              { name: "Desktop FHD", width: 1920, height: 1080 },
              { name: "Desktop 4K", width: 3840, height: 2160 },
            ].map((preset) => (
              <Button
                key={preset.name}
                variant="ghost"
                size="sm"
                onClick={() => onAdjustViewport?.(preset.width, preset.height)}
                className="h-auto p-3 flex flex-col gap-1 border border-border/50 rounded-xl hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="text-xs font-medium">{preset.name}</span>
                <span className="text-xs text-muted-foreground">
                  {preset.width} × {preset.height}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};