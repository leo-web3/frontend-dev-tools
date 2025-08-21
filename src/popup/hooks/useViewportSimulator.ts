import { useState, useCallback } from 'react';
import type { DeviceSpec } from '@/shared/deviceDatabase';

export interface ViewportAdjustmentResult {
  success: boolean;
  data?: {
    windowWidth?: number;
    windowHeight?: number;
    viewportWidth: number;
    viewportHeight: number | null;
    finalWidth: number;
    finalHeight: number;
    widthAdjustment: number;
    heightAdjusted: boolean;
    screenConstrained: boolean;
  };
  error?: string;
}

export const useViewportSimulator = () => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [lastAdjustment, setLastAdjustment] = useState<ViewportAdjustmentResult | null>(null);

  const adjustViewport = useCallback(async (
    width: number, 
    height: number | null, 
    device?: DeviceSpec
  ): Promise<ViewportAdjustmentResult> => {
    setIsAdjusting(true);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: "ADJUST_BROWSER_SIZE",
        payload: { width, height },
      });
      
      const result: ViewportAdjustmentResult = {
        success: response?.success || false,
        data: response?.data,
        error: response?.error,
      };
      
      setLastAdjustment(result);
      return result;
    } catch (error) {
      const result: ViewportAdjustmentResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Viewport adjustment failed',
      };
      
      setLastAdjustment(result);
      return result;
    } finally {
      setIsAdjusting(false);
    }
  }, []);

  const getViewportDimensions = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_VIEWPORT_DIMENSIONS",
      });
      
      if (response?.success) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get viewport dimensions:', error);
      return null;
    }
  }, []);

  const calculateOptimalSize = useCallback((
    targetWidth: number, 
    targetHeight: number | null,
    maxScreenWidth: number = 1920,
    maxScreenHeight: number = 1080
  ) => {
    const maxWidth = Math.floor(maxScreenWidth * 0.95);
    const maxHeight = Math.floor(maxScreenHeight * 0.95);
    
    const finalWidth = Math.min(Math.max(targetWidth, 100), maxWidth);
    const finalHeight = targetHeight ? Math.min(Math.max(targetHeight, 100), maxHeight) : null;
    
    return {
      width: finalWidth,
      height: finalHeight,
      isConstrained: finalWidth !== targetWidth || (targetHeight && finalHeight !== targetHeight),
    };
  }, []);

  return {
    adjustViewport,
    getViewportDimensions,
    calculateOptimalSize,
    isAdjusting,
    lastAdjustment,
  };
};