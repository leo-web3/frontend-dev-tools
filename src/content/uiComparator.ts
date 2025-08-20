import { UIOverlay, ExtensionResponse } from '@/shared/types';
import { generateId } from '@/shared/utils';

export class UIComparator {
  private overlays: Map<string, HTMLElement> = new Map();
  private dragState: {
    isDragging: boolean;
    currentOverlay?: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } = {
    isDragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  };

  constructor() {
    this.initializeGlobalStyles();
    this.initializeEventListeners();
  }

  async createOverlay(overlayData: UIOverlay): Promise<ExtensionResponse> {
    try {
      console.log('Creating overlay with data:', overlayData);
      
      // Wait for document.body to be available
      const appendOverlayWhenReady = () => {
        return new Promise<void>((resolve) => {
          const checkBodyReady = () => {
            if (document.body) {
              const overlayWrapper = this.createOverlayElement(overlayData);
              this.overlays.set(overlayData.id, overlayWrapper);
              document.body.appendChild(overlayWrapper);
              
              console.log('Overlay created and added to DOM:', overlayData.id);
              console.log('Total overlays:', this.overlays.size);
              resolve();
            } else {
              setTimeout(checkBodyReady, 10);
            }
          };
          checkBodyReady();
        });
      };

      await appendOverlayWhenReady();

      return { 
        success: true, 
        data: `Overlay ${overlayData.id} created` 
      };
    } catch (error) {
      console.error('Failed to create overlay:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create overlay',
      };
    }
  }

  async updateOverlay(
    id: string, 
    updates: Partial<UIOverlay>
  ): Promise<ExtensionResponse> {
    try {
      const overlayElement = this.overlays.get(id);
      if (!overlayElement) {
        return {
          success: false,
          error: 'Overlay not found',
        };
      }

      this.applyUpdatesToElement(overlayElement, updates);

      return { 
        success: true, 
        data: `Overlay ${id} updated` 
      };
    } catch (error) {
      console.error('Failed to update overlay:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update overlay',
      };
    }
  }

  async removeOverlay(id: string): Promise<ExtensionResponse> {
    try {
      const overlayElement = this.overlays.get(id);
      if (overlayElement) {
        // Remove associated menu element
        const menuElement = (overlayElement as any)._menuElement;
        if (menuElement && menuElement.parentNode) {
          menuElement.parentNode.removeChild(menuElement);
        }
        
        // Remove overlay wrapper
        overlayElement.remove();
        this.overlays.delete(id);
      }

      return { 
        success: true, 
        data: `Overlay ${id} removed` 
      };
    } catch (error) {
      console.error('Failed to remove overlay:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove overlay',
      };
    }
  }

  async toggleVisibility(id: string): Promise<ExtensionResponse> {
    try {
      const overlayElement = this.overlays.get(id);
      if (!overlayElement) {
        return {
          success: false,
          error: 'Overlay not found',
        };
      }

      const isVisible = overlayElement.style.display !== 'none';
      overlayElement.style.display = isVisible ? 'none' : 'block';

      return { 
        success: true, 
        data: `Overlay ${id} ${isVisible ? 'hidden' : 'shown'}` 
      };
    } catch (error) {
      console.error('Failed to toggle overlay visibility:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle visibility',
      };
    }
  }

  clearAllOverlays(): void {
    this.overlays.forEach((overlay) => {
      // Remove associated menu element
      const menuElement = (overlay as any)._menuElement;
      if (menuElement && menuElement.parentNode) {
        menuElement.parentNode.removeChild(menuElement);
      }
      // Remove overlay wrapper
      overlay.remove();
    });
    this.overlays.clear();
  }

  adjustOverlaysToPageChanges(): void {
    // Re-adjust overlays if the page layout changes
    this.overlays.forEach((overlay, id) => {
      // Ensure overlay is still properly positioned
      if (document.body && overlay.parentNode !== document.body) {
        document.body.appendChild(overlay);
      }
    });
  }

  private createOverlayElement(overlayData: UIOverlay): HTMLElement {
    // Create wrapper to hold both overlay and menu
    const wrapper = document.createElement('div');
    wrapper.className = 'fe-dev-tools-overlay-wrapper';
    wrapper.setAttribute('data-overlay-id', overlayData.id);

    // Create overlay container for image
    const container = document.createElement('div');
    container.className = 'fe-dev-tools-overlay-container';

    // Create image element
    const img = document.createElement('img');
    img.src = overlayData.imageUrl;
    img.alt = 'UI Comparison Overlay';
    img.draggable = false;

    // Log image dimensions when loaded (for debugging)
    img.onload = () => {
      console.log(`Image loaded: ${img.naturalWidth}x${img.naturalHeight}px, Container: ${overlayData.size.width}x${overlayData.size.height}px`);
    };

    container.appendChild(img);

    // Create controls (menu) - separate from container
    const controls = this.createControlsElement(overlayData.id);

    // Add container to wrapper
    wrapper.appendChild(container);
    
    // Apply initial styles and properties to wrapper
    this.applyStylesAndProperties(wrapper, overlayData);

    // Position and add controls 
    this.positionMenuForOverlay(controls, overlayData);
    
    // Store the menu element reference in the wrapper for cleanup
    (wrapper as any)._menuElement = controls;

    return wrapper;
  }

  private positionMenuForOverlay(menuContainer: HTMLElement, overlayData: UIOverlay): void {
    const { position, size } = overlayData;
    // Position menu at bottom-right corner of the overlay
    const menuX = position.x + size.width - 45; // 45px to account for menu button size and margin
    const menuY = position.y + size.height - 45;
    
    menuContainer.style.setProperty('left', `${menuX}px`, 'important');
    menuContainer.style.setProperty('top', `${menuY}px`, 'important');
    
    // Add to document body if not already added
    if (!menuContainer.parentNode) {
      document.body.appendChild(menuContainer);
    }
  }

  private createControlsElement(overlayId: string): HTMLElement {
    // Create main menu button in bottom-right corner
    const menuButton = document.createElement('div');
    menuButton.className = 'fe-dev-tools-menu-button';
    menuButton.innerHTML = '⚙️';
    menuButton.title = '图层设置';
    
    // Create dropdown menu
    const menuDropdown = document.createElement('div');
    menuDropdown.className = 'fe-dev-tools-menu-dropdown';
    menuDropdown.style.display = 'none';
    
    // Menu items
    const menuItems = [
      { text: '🔒 冻结图层', action: 'freeze', id: `freeze-${overlayId}` },
      { text: '👁️ 隐藏图层', action: 'hide', id: `hide-${overlayId}` },
      { text: '📏 调整尺寸', action: 'resize', id: `resize-${overlayId}` },
      { text: '❌ 删除图层', action: 'delete', id: `delete-${overlayId}` }
    ];
    
    menuItems.forEach(({ text, action, id }) => {
      const item = document.createElement('div');
      item.className = 'fe-dev-tools-menu-item';
      item.innerHTML = text;
      item.onclick = (e) => {
        e.stopPropagation();
        this.handleMenuAction(overlayId, action);
        menuDropdown.style.display = 'none';
      };
      menuDropdown.appendChild(item);
    });
    
    // Transparency slider in menu
    const transparencyItem = document.createElement('div');
    transparencyItem.className = 'fe-dev-tools-menu-item fe-dev-tools-transparency-item';
    
    const transparencyLabel = document.createElement('span');
    transparencyLabel.textContent = '🎨 透明度: ';
    transparencyLabel.style.fontSize = '12px';
    
    const transparencySlider = document.createElement('input');
    transparencySlider.type = 'range';
    transparencySlider.min = '0';
    transparencySlider.max = '100';
    transparencySlider.value = '70';
    transparencySlider.className = 'fe-dev-tools-transparency-slider';
    transparencySlider.oninput = (e) => {
      e.stopPropagation();
      const value = (e.target as HTMLInputElement).value;
      const container = menuButton.closest('.fe-dev-tools-overlay-container') as HTMLElement;
      if (container) {
        container.style.opacity = (parseInt(value) / 100).toString();
      }
    };
    
    transparencyItem.appendChild(transparencyLabel);
    transparencyItem.appendChild(transparencySlider);
    menuDropdown.appendChild(transparencyItem);
    
    // Toggle menu on button click
    menuButton.onclick = (e) => {
      e.stopPropagation();
      const isVisible = menuDropdown.style.display !== 'none';
      menuDropdown.style.display = isVisible ? 'none' : 'block';
    };
    
    // Hide menu when clicking outside
    document.addEventListener('click', () => {
      menuDropdown.style.display = 'none';
    });
    
    const container = document.createElement('div');
    container.className = 'fe-dev-tools-menu-container';
    container.appendChild(menuButton);
    container.appendChild(menuDropdown);
    
    console.log('Menu container created:', container);
    console.log('Menu button created:', menuButton);
    
    return container;
  }

  private applyStylesAndProperties(
    wrapper: HTMLElement, 
    overlayData: UIOverlay
  ): void {
    const { position, size, opacity, visible, locked } = overlayData;

    // Set wrapper styles
    wrapper.style.setProperty('position', 'fixed', 'important');
    wrapper.style.setProperty('left', `${position.x}px`, 'important');
    wrapper.style.setProperty('top', `${position.y}px`, 'important');
    wrapper.style.setProperty('width', `${size.width}px`, 'important');
    wrapper.style.setProperty('height', `${size.height}px`, 'important');
    wrapper.style.setProperty('opacity', opacity.toString(), 'important');
    wrapper.style.setProperty('display', visible ? 'block' : 'none', 'important');
    wrapper.style.setProperty('z-index', '999998', 'important');
    wrapper.style.setProperty('pointer-events', locked ? 'none' : 'auto', 'important');
    wrapper.style.setProperty('user-select', 'none', 'important');
    
    // Style the overlay container (with border)
    const container = wrapper.querySelector('.fe-dev-tools-overlay-container') as HTMLElement;
    if (container) {
      container.style.setProperty('position', 'relative', 'important');
      container.style.setProperty('width', '100%', 'important');
      container.style.setProperty('height', '100%', 'important');
      container.style.setProperty('border', '2px dashed rgba(59, 130, 246, 0.5)', 'important');
      container.style.setProperty('box-sizing', 'border-box', 'important');
    }

    // Make draggable if not locked
    if (!locked) {
      wrapper.style.cursor = 'move';
      wrapper.addEventListener('mousedown', (e) => this.startDrag(e, overlayData.id));
    }

    // Image styles - use natural size instead of forcing 100%
    const img = wrapper.querySelector('img') as HTMLImageElement;
    if (img) {
      img.style.cssText = `
        width: auto !important;
        height: auto !important;
        max-width: 100% !important;
        max-height: 100% !important;
        display: block !important;
        pointer-events: none !important;
      `;
    }
  }

  private applyUpdatesToElement(
    element: HTMLElement, 
    updates: Partial<UIOverlay>
  ): void {
    if (updates.position) {
      element.style.left = `${updates.position.x}px`;
      element.style.top = `${updates.position.y}px`;
    }

    if (updates.size) {
      element.style.width = `${updates.size.width}px`;
      element.style.height = `${updates.size.height}px`;
    }

    if (updates.opacity !== undefined) {
      element.style.opacity = updates.opacity.toString();
    }

    if (updates.visible !== undefined) {
      element.style.display = updates.visible ? 'block' : 'none';
      
      // Also update menu visibility
      const menuElement = (element as any)._menuElement;
      if (menuElement) {
        menuElement.style.display = updates.visible ? 'block' : 'none';
      }
    }

    if (updates.locked !== undefined) {
      element.style.pointerEvents = updates.locked ? 'none' : 'auto';
      element.style.cursor = updates.locked ? 'default' : 'move';
    }

    // Update menu position if position or size changed
    if ((updates.position || updates.size) && element.hasAttribute('data-overlay-id')) {
      const menuElement = (element as any)._menuElement;
      if (menuElement) {
        // Get current element style values
        const currentX = parseInt(element.style.left) || 0;
        const currentY = parseInt(element.style.top) || 0;
        const currentWidth = parseInt(element.style.width) || 0;
        const currentHeight = parseInt(element.style.height) || 0;
        
        // Reposition menu
        this.positionMenuForOverlay(menuElement, {
          position: { x: currentX, y: currentY },
          size: { width: currentWidth, height: currentHeight }
        } as UIOverlay);
      }
    }
  }

  private handleControlAction(overlayId: string, action: string): void {
    switch (action) {
      case 'toggle':
        this.toggleVisibility(overlayId);
        break;
      case 'lock':
        // Toggle lock state - would need to track this in overlay data
        break;
      case 'delete':
        this.removeOverlay(overlayId);
        break;
    }
  }

  private handleMenuAction(overlayId: string, action: string): void {
    const overlayElement = this.overlays.get(overlayId);
    if (!overlayElement) return;

    switch (action) {
      case 'freeze':
        this.toggleFreeze(overlayId, overlayElement);
        break;
      case 'hide':
        this.toggleVisibility(overlayId);
        break;
      case 'resize':
        this.showResizeDialog(overlayId, overlayElement);
        break;
      case 'delete':
        this.removeOverlay(overlayId);
        break;
    }
  }

  private toggleFreeze(overlayId: string, overlayElement: HTMLElement): void {
    const isFrozen = overlayElement.style.pointerEvents === 'none';
    
    if (isFrozen) {
      // Unfreeze
      overlayElement.style.pointerEvents = 'auto';
      overlayElement.style.cursor = 'move';
      overlayElement.style.border = '2px dashed rgba(59, 130, 246, 0.5)';
      
      // Re-enable drag
      const dragHandler = (e: MouseEvent) => this.startDrag(e, overlayId);
      overlayElement.addEventListener('mousedown', dragHandler);
    } else {
      // Freeze
      overlayElement.style.pointerEvents = 'none';
      overlayElement.style.cursor = 'default';
      overlayElement.style.border = '2px solid rgba(34, 197, 94, 0.8)';
      
      // Disable drag by removing event listeners
      const newElement = overlayElement.cloneNode(true) as HTMLElement;
      overlayElement.parentNode?.replaceChild(newElement, overlayElement);
      this.overlays.set(overlayId, newElement);
      
      // Re-enable menu button
      const menuContainer = newElement.querySelector('.fe-dev-tools-menu-container') as HTMLElement;
      if (menuContainer) {
        menuContainer.style.pointerEvents = 'auto';
      }
    }
  }

  private showResizeDialog(overlayId: string, overlayElement: HTMLElement): void {
    const currentWidth = parseInt(overlayElement.style.width) || 300;
    const currentHeight = parseInt(overlayElement.style.height) || 200;
    
    const newWidth = prompt(`请输入新的宽度 (当前: ${currentWidth}px):`, currentWidth.toString());
    if (newWidth === null) return;
    
    const newHeight = prompt(`请输入新的高度 (当前: ${currentHeight}px):`, currentHeight.toString());
    if (newHeight === null) return;
    
    const width = parseInt(newWidth);
    const height = parseInt(newHeight);
    
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      alert('请输入有效的数字');
      return;
    }
    
    overlayElement.style.width = `${width}px`;
    overlayElement.style.height = `${height}px`;
    
    // Update stored overlay data
    chrome.runtime.sendMessage({
      type: 'UPDATE_OVERLAY_SIZE',
      payload: {
        id: overlayId,
        size: { width, height }
      }
    });
  }

  private startDrag(e: MouseEvent, overlayId: string): void {
    if (this.dragState.isDragging) return;

    const element = this.overlays.get(overlayId);
    if (!element) return;

    this.dragState = {
      isDragging: true,
      currentOverlay: overlayId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: parseInt(element.style.left) || 0,
      startTop: parseInt(element.style.top) || 0,
    };

    e.preventDefault();
  }

  private initializeEventListeners(): void {
    document.addEventListener('mousemove', (e) => {
      if (!this.dragState.isDragging || !this.dragState.currentOverlay) return;

      const element = this.overlays.get(this.dragState.currentOverlay);
      if (!element) return;

      const deltaX = e.clientX - this.dragState.startX;
      const deltaY = e.clientY - this.dragState.startY;

      element.style.left = `${this.dragState.startLeft + deltaX}px`;
      element.style.top = `${this.dragState.startTop + deltaY}px`;
    });

    document.addEventListener('mouseup', () => {
      if (this.dragState.isDragging) {
        // Send position update to background script
        const overlayId = this.dragState.currentOverlay;
        if (overlayId) {
          const element = this.overlays.get(overlayId);
          if (element) {
            const newX = parseInt(element.style.left);
            const newY = parseInt(element.style.top);
            
            chrome.runtime.sendMessage({
              type: 'UPDATE_OVERLAY_POSITION',
              payload: {
                id: overlayId,
                position: { x: newX, y: newY }
              }
            });
          }
        }
      }

      this.dragState.isDragging = false;
      this.dragState.currentOverlay = undefined;
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Toggle all overlays with Ctrl+Shift+U
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyU') {
        e.preventDefault();
        this.toggleAllOverlays();
      }

      // Hide all overlays with Escape
      if (e.code === 'Escape') {
        this.hideAllOverlays();
      }
    });
  }

  private toggleAllOverlays(): void {
    const visibleCount = Array.from(this.overlays.values())
      .filter(overlay => overlay.style.display !== 'none').length;
    
    const shouldHide = visibleCount > 0;

    this.overlays.forEach((overlay) => {
      overlay.style.display = shouldHide ? 'none' : 'block';
    });
  }

  private hideAllOverlays(): void {
    this.overlays.forEach((overlay) => {
      overlay.style.display = 'none';
    });
  }

  private initializeGlobalStyles(): void {
    const styleId = 'fe-dev-tools-overlay-styles';
    if (document.getElementById(styleId)) return;

    const addStylesWhenReady = () => {
      if (!document.head) {
        setTimeout(addStylesWhenReady, 10);
        return;
      }

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .fe-dev-tools-overlay-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 12px !important;
        }
        
        .fe-dev-tools-overlay-container {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        .fe-dev-tools-overlay-wrapper:hover .fe-dev-tools-menu-container {
          opacity: 1 !important;
        }
        
        .fe-dev-tools-menu-container {
          position: fixed !important;
          opacity: 0.8 !important;
          transition: opacity 0.2s ease !important;
          z-index: 999999 !important;
          pointer-events: auto !important;
        }
        
        .fe-dev-tools-menu-button {
          background: #007bff !important;
          color: white !important;
          border: 2px solid rgba(255, 255, 255, 0.5) !important;
          border-radius: 50% !important;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          font-size: 20px !important;
          font-weight: bold !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 4px 16px rgba(0, 123, 255, 0.3) !important;
        }
        
        .fe-dev-tools-menu-button:hover {
          background: rgba(0, 0, 0, 0.9) !important;
          transform: scale(1.1) !important;
        }
        
        .fe-dev-tools-menu-dropdown {
          position: absolute !important;
          bottom: 40px !important;
          right: 0 !important;
          background: rgba(0, 0, 0, 0.9) !important;
          border-radius: 8px !important;
          padding: 8px !important;
          min-width: 160px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: blur(8px) !important;
        }
        
        .fe-dev-tools-menu-item {
          color: white !important;
          padding: 8px 12px !important;
          cursor: pointer !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
          transition: background 0.2s ease !important;
          white-space: nowrap !important;
        }
        
        .fe-dev-tools-menu-item:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        
        .fe-dev-tools-transparency-item {
          padding: 6px 12px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        
        .fe-dev-tools-transparency-slider {
          flex: 1 !important;
          height: 4px !important;
          background: rgba(255, 255, 255, 0.3) !important;
          border-radius: 2px !important;
          outline: none !important;
          -webkit-appearance: none !important;
        }
        
        .fe-dev-tools-transparency-slider::-webkit-slider-thumb {
          -webkit-appearance: none !important;
          width: 12px !important;
          height: 12px !important;
          background: white !important;
          border-radius: 50% !important;
          cursor: pointer !important;
        }
        
        .fe-dev-tools-transparency-slider::-moz-range-thumb {
          width: 12px !important;
          height: 12px !important;
          background: white !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          border: none !important;
        }
      `;
      
      document.head.appendChild(style);
    };

    addStylesWhenReady();
  }
}