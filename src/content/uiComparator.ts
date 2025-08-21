import { ExtensionResponse, UIOverlay } from "@/shared/types";

export class UIComparator {
  private overlays: Map<string, HTMLElement> = new Map();
  private globalMenuContainer: HTMLElement | null = null;
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
    this.initializeScrollSync();
  }

  async createOverlay(overlayData: UIOverlay): Promise<ExtensionResponse> {
    try {
      console.log("Creating overlay with data:", overlayData);

      // Wait for document.body to be available
      const appendOverlayWhenReady = () => {
        return new Promise<void>((resolve) => {
          const checkBodyReady = () => {
            if (document.body) {
              // Create global menu if it doesn't exist
              if (!this.globalMenuContainer) {
                this.createGlobalMenuContainer();
              }

              const overlayWrapper = this.createOverlayElement(overlayData);
              this.overlays.set(overlayData.id, overlayWrapper);
              document.body.appendChild(overlayWrapper);

              // Update menu visibility and refresh layer menu
              this.updateGlobalMenuVisibility();
              this.refreshLayerMenu();

              console.log("Overlay created and added to DOM:", overlayData.id);
              console.log("Total overlays:", this.overlays.size);
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
        data: `Overlay ${overlayData.id} created`,
      };
    } catch (error) {
      console.error("Failed to create overlay:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create overlay",
      };
    }
  }

  async updateOverlay(id: string, updates: Partial<UIOverlay>): Promise<ExtensionResponse> {
    try {
      const overlayElement = this.overlays.get(id);
      if (!overlayElement) {
        return {
          success: false,
          error: "Overlay not found",
        };
      }

      this.applyUpdatesToElement(overlayElement, updates);

      return {
        success: true,
        data: `Overlay ${id} updated`,
      };
    } catch (error) {
      console.error("Failed to update overlay:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update overlay",
      };
    }
  }

  async removeOverlay(id: string): Promise<ExtensionResponse> {
    try {
      const overlayElement = this.overlays.get(id);
      if (overlayElement) {
        // Remove overlay wrapper
        overlayElement.remove();
        this.overlays.delete(id);
      }

      // Update menu visibility and refresh layer info
      this.updateGlobalMenuVisibility();
      this.refreshLayerMenu();

      return {
        success: true,
        data: `Overlay ${id} removed`,
      };
    } catch (error) {
      console.error("Failed to remove overlay:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove overlay",
      };
    }
  }

  async toggleVisibility(id: string): Promise<ExtensionResponse> {
    try {
      const overlayElement = this.overlays.get(id);
      if (!overlayElement) {
        return {
          success: false,
          error: "Overlay not found",
        };
      }

      const isVisible = overlayElement.style.display !== "none";
      overlayElement.style.display = isVisible ? "none" : "block";

      return {
        success: true,
        data: `Overlay ${id} ${isVisible ? "hidden" : "shown"}`,
      };
    } catch (error) {
      console.error("Failed to toggle overlay visibility:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle visibility",
      };
    }
  }

  clearAllOverlays(): void {
    this.overlays.forEach((overlay) => {
      // Remove overlay wrapper
      overlay.remove();
    });
    this.overlays.clear();

    // Hide global menu and refresh layer info
    this.updateGlobalMenuVisibility();
    this.refreshLayerMenu();
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
    // Check if overlay already exists
    const existingOverlay = document.getElementById(`fe-dev-tools-overlay-${overlayData.id}`);
    if (existingOverlay) {
      console.warn(`Overlay with ID ${overlayData.id} already exists, removing existing one`);
      existingOverlay.remove();
    }

    // Create wrapper to hold overlay
    const wrapper = document.createElement("div");
    wrapper.id = `fe-dev-tools-overlay-${overlayData.id}`;

    // Create overlay container for image
    const container = document.createElement("div");
    container.className = "fe-dev-tools-overlay-container";

    // Create image element
    const img = document.createElement("img");
    img.src = overlayData.imageUrl;
    img.alt = "UI Comparison Overlay";
    img.draggable = false;

    // Log image dimensions when loaded (for debugging)
    img.onload = () => {
      console.log(
        `Image loaded: ${img.naturalWidth}x${img.naturalHeight}px, Container: ${overlayData.size.width}x${overlayData.size.height}px`
      );
    };

    container.appendChild(img);

    // Add container to wrapper
    wrapper.appendChild(container);

    // Apply initial styles and properties to wrapper
    this.applyStylesAndProperties(wrapper, overlayData);

    return wrapper;
  }

  private createGlobalMenuContainer(): void {
    if (this.globalMenuContainer) return;

    // Check if menu container already exists
    const existingMenu = document.getElementById("fe-dev-tools-menu-container");
    if (existingMenu) {
      console.warn("Menu container already exists, removing existing one");
      existingMenu.remove();
    }

    this.globalMenuContainer = document.createElement("div");
    this.globalMenuContainer.id = "fe-dev-tools-menu-container";
    this.globalMenuContainer.style.cssText = `
      position: fixed !important;
      bottom: 0 !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 999999 !important;
      pointer-events: auto !important;
      opacity: 0.9 !important;
      transition: opacity 0.2s ease !important;
      background: rgba(0, 0, 0, 0.8) !important;
      backdrop-filter: blur(10px) !important;
      border-radius: 8px 8px 0 0 !important;
      padding: 8px 16px !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      min-width: 300px !important;
      justify-content: center !important;
    `;

    this.createToolbarButtons();
    this.createLayersList();

    document.body.appendChild(this.globalMenuContainer);
    console.log("Global menu toolbar created and positioned");
  }

  private updateGlobalMenuVisibility(): void {
    if (this.globalMenuContainer) {
      const hasOverlays = this.overlays.size > 0;
      this.globalMenuContainer.style.display = hasOverlays ? "block" : "none";
      console.log(`Global menu visibility: ${hasOverlays ? "visible" : "hidden"}`);
    }
  }

  private createToolbarButtons(): void {
    if (!this.globalMenuContainer) return;

    // Toggle all overlays button
    const toggleBtn = document.createElement("button");
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 3C4.5 3 1.5 5.5 0 8C1.5 10.5 4.5 13 8 13C11.5 13 14.5 10.5 16 8C14.5 5.5 11.5 3 8 3ZM8 11C6.5 11 5 9.5 5 8C5 6.5 6.5 5 8 5C9.5 5 11 6.5 11 8C11 9.5 9.5 11 8 11ZM8 6.5C7.2 6.5 6.5 7.2 6.5 8C6.5 8.8 7.2 9.5 8 9.5C8.8 9.5 9.5 8.8 9.5 8C9.5 7.2 8.8 6.5 8 6.5Z" fill="currentColor"/>
      </svg>
    `;
    toggleBtn.title = "切换所有图层";
    toggleBtn.className = "fe-dev-tools-toolbar-btn";
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      this.toggleAllOverlays();
    };

    // Freeze all overlays button
    const freezeBtn = document.createElement("button");
    freezeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M5 7V5C5 2.8 6.8 1 9 1C11.2 1 13 2.8 13 5V7H14C14.6 7 15 7.4 15 8V14C15 14.6 14.6 15 14 15H4C3.4 15 3 14.6 3 14V8C3 7.4 3.4 7 4 7H5ZM6.5 7H11.5V5C11.5 3.6 10.4 2.5 9 2.5C7.6 2.5 6.5 3.6 6.5 5V7Z" fill="currentColor"/>
        <circle cx="9" cy="11" r="1" fill="currentColor"/>
      </svg>
    `;
    freezeBtn.title = "冻结/解冻所有图层";
    freezeBtn.className = "fe-dev-tools-toolbar-btn";
    freezeBtn.onclick = (e) => {
      e.stopPropagation();
      this.freezeAllOverlays();
    };

    // Delete all overlays button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6.5 1.5V2H3V3.5H4V13C4 13.8 4.7 14.5 5.5 14.5H10.5C11.3 14.5 12 13.8 12 13V3.5H13V2H9.5V1.5H6.5ZM5.5 3.5H10.5V13H5.5V3.5ZM7 5V11.5H8.5V5H7ZM9.5 5V11.5H11V5H9.5Z" fill="currentColor"/>
      </svg>
    `;
    deleteBtn.title = "删除所有图层";
    deleteBtn.className = "fe-dev-tools-toolbar-btn fe-dev-tools-delete-btn";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      this.clearAllOverlays();
    };

    // Transparency slider
    const opacityContainer = document.createElement("div");
    opacityContainer.className = "fe-dev-tools-opacity-container";
    
    const opacityLabel = document.createElement("span");
    opacityLabel.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L3 6V10C3 12.8 5.2 15 8 15C10.8 15 13 12.8 13 10V6L8 1ZM8 13.5C6 13.5 4.5 12 4.5 10V6.5L8 3L11.5 6.5V10C11.5 12 10 13.5 8 13.5Z" fill="currentColor"/>
        <path d="M8 4.5C6.6 4.5 5.5 5.6 5.5 7V10C5.5 11.4 6.6 12.5 8 12.5V4.5Z" fill="currentColor" opacity="0.6"/>
      </svg>
    `;
    opacityLabel.title = "透明度";
    
    const opacitySlider = document.createElement("input");
    opacitySlider.type = "range";
    opacitySlider.min = "0";
    opacitySlider.max = "100";
    opacitySlider.value = "70";
    opacitySlider.className = "fe-dev-tools-opacity-slider";
    opacitySlider.oninput = (e) => {
      e.stopPropagation();
      const value = (e.target as HTMLInputElement).value;
      const opacity = parseInt(value) / 100;
      this.overlays.forEach((overlay) => {
        overlay.style.opacity = opacity.toString();
      });
    };

    opacityContainer.appendChild(opacityLabel);
    opacityContainer.appendChild(opacitySlider);

    this.globalMenuContainer.appendChild(toggleBtn);
    this.globalMenuContainer.appendChild(freezeBtn);
    this.globalMenuContainer.appendChild(deleteBtn);
    this.globalMenuContainer.appendChild(opacityContainer);
  }

  private createLayersList(): void {
    if (!this.globalMenuContainer) return;

    // Layer info display
    const layerInfo = document.createElement("div");
    layerInfo.id = "fe-dev-tools-layer-info";
    layerInfo.className = "fe-dev-tools-layer-info";
    
    this.globalMenuContainer.appendChild(layerInfo);
    this.updateLayerInfo();
  }

  private updateLayerInfo(): void {
    const layerInfo = this.globalMenuContainer?.querySelector("#fe-dev-tools-layer-info") as HTMLElement;
    if (!layerInfo) return;

    if (this.overlays.size === 0) {
      layerInfo.innerHTML = `
        <span class="fe-dev-tools-layer-count">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 4px;">
            <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" opacity="0.3"/>
            <rect x="2" y="6" width="12" height="2" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="2" y="9" width="12" height="2" rx="1" fill="currentColor" opacity="0.9"/>
            <rect x="2" y="12" width="12" height="2" rx="1" fill="currentColor"/>
          </svg>
          暂无图层
        </span>
      `;
      return;
    }

    const visibleCount = Array.from(this.overlays.values()).filter(
      (overlay) => overlay.style.display !== "none"
    ).length;
    
    layerInfo.innerHTML = `
      <span class="fe-dev-tools-layer-count">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 4px;">
          <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" opacity="0.3"/>
          <rect x="2" y="6" width="12" height="2" rx="1" fill="currentColor" opacity="0.6"/>
          <rect x="2" y="9" width="12" height="2" rx="1" fill="currentColor" opacity="0.9"/>
          <rect x="2" y="12" width="12" height="2" rx="1" fill="currentColor"/>
        </svg>
        ${this.overlays.size} 层 (${visibleCount} 可见)
      </span>
    `;
  }

  private refreshLayerMenu(): void {
    this.updateLayerInfo();
  }



  private applyStylesAndProperties(wrapper: HTMLElement, overlayData: UIOverlay): void {
    const { position, size, opacity, visible, locked } = overlayData;

    // Store original position for scroll sync
    wrapper.setAttribute('data-original-left', position.x.toString());
    wrapper.setAttribute('data-original-top', position.y.toString());

    // Set wrapper styles
    wrapper.style.setProperty("position", "fixed", "important");
    wrapper.style.setProperty("left", `${position.x}px`, "important");
    wrapper.style.setProperty("top", `${position.y}px`, "important");
    wrapper.style.setProperty("width", `${size.width}px`, "important");
    wrapper.style.setProperty("height", `${size.height}px`, "important");
    wrapper.style.setProperty("opacity", opacity.toString(), "important");
    wrapper.style.setProperty("display", visible ? "block" : "none", "important");
    wrapper.style.setProperty("z-index", "999998", "important");
    wrapper.style.setProperty("pointer-events", locked ? "none" : "auto", "important");
    wrapper.style.setProperty("user-select", "none", "important");

    // Style the overlay container (with border)
    const container = wrapper.querySelector(".fe-dev-tools-overlay-container") as HTMLElement;
    if (container) {
      container.style.setProperty("position", "relative", "important");
      container.style.setProperty("width", "100%", "important");
      container.style.setProperty("height", "100%", "important");
      container.style.setProperty("border", "2px dashed rgba(59, 130, 246, 0.5)", "important");
      container.style.setProperty("box-sizing", "border-box", "important");
    }

    // Make draggable if not locked
    if (!locked) {
      wrapper.style.cursor = "move";
      wrapper.addEventListener("mousedown", (e) => this.startDrag(e, overlayData.id));
    }

    // Image styles - use natural size instead of forcing 100%
    const img = wrapper.querySelector("img") as HTMLImageElement;
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

  private applyUpdatesToElement(element: HTMLElement, updates: Partial<UIOverlay>): void {
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
      element.style.display = updates.visible ? "block" : "none";
    }

    if (updates.locked !== undefined) {
      element.style.pointerEvents = updates.locked ? "none" : "auto";
      element.style.cursor = updates.locked ? "default" : "move";
    }
  }


  private freezeAllOverlays(): void {
    this.overlays.forEach((overlayElement) => {
      const isFrozen = overlayElement.style.pointerEvents === "none";
      
      if (isFrozen) {
        // Unfreeze
        overlayElement.style.pointerEvents = "auto";
        overlayElement.style.cursor = "move";
        const container = overlayElement.querySelector(".fe-dev-tools-overlay-container") as HTMLElement;
        if (container) {
          container.style.border = "2px dashed rgba(59, 130, 246, 0.5)";
        }
      } else {
        // Freeze
        overlayElement.style.pointerEvents = "none";
        overlayElement.style.cursor = "default";
        const container = overlayElement.querySelector(".fe-dev-tools-overlay-container") as HTMLElement;
        if (container) {
          container.style.border = "2px solid rgba(34, 197, 94, 0.8)";
        }
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
    document.addEventListener("mousemove", (e) => {
      if (!this.dragState.isDragging || !this.dragState.currentOverlay) return;

      const element = this.overlays.get(this.dragState.currentOverlay);
      if (!element) return;

      const deltaX = e.clientX - this.dragState.startX;
      const deltaY = e.clientY - this.dragState.startY;

      element.style.left = `${this.dragState.startLeft + deltaX}px`;
      element.style.top = `${this.dragState.startTop + deltaY}px`;
    });

    document.addEventListener("mouseup", () => {
      if (this.dragState.isDragging) {
        // Send position update to background script
        const overlayId = this.dragState.currentOverlay;
        if (overlayId) {
          const element = this.overlays.get(overlayId);
          if (element) {
            const newX = parseInt(element.style.left);
            const newY = parseInt(element.style.top);

            // Update original position for scroll sync
            element.setAttribute('data-original-left', newX.toString());
            element.setAttribute('data-original-top', newY.toString());

            chrome.runtime.sendMessage({
              type: "UPDATE_OVERLAY_POSITION",
              payload: {
                id: overlayId,
                position: { x: newX, y: newY },
              },
            });
          }
        }
      }

      this.dragState.isDragging = false;
      this.dragState.currentOverlay = undefined;
    });

    // Handle keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // Toggle all overlays with Ctrl+Shift+U
      if (e.ctrlKey && e.shiftKey && e.code === "KeyU") {
        e.preventDefault();
        this.toggleAllOverlays();
      }

      // Hide all overlays with Escape
      if (e.code === "Escape") {
        this.hideAllOverlays();
      }
    });
  }

  private toggleAllOverlays(): void {
    const visibleCount = Array.from(this.overlays.values()).filter(
      (overlay) => overlay.style.display !== "none"
    ).length;

    const shouldHide = visibleCount > 0;

    this.overlays.forEach((overlay) => {
      overlay.style.display = shouldHide ? "none" : "block";
    });
  }

  private hideAllOverlays(): void {
    this.overlays.forEach((overlay) => {
      overlay.style.display = "none";
    });
  }

  private initializeScrollSync(): void {
    let ticking = false;
    
    const updateOverlayPositions = () => {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      this.overlays.forEach((overlayElement) => {
        // Only sync scroll for non-locked overlays
        if (overlayElement.style.pointerEvents !== "none") {
          // Get original position (stored in data attributes or calculate from current style)
          const originalY = parseInt(overlayElement.getAttribute('data-original-top') || overlayElement.style.top) || 0;
          const originalX = parseInt(overlayElement.getAttribute('data-original-left') || overlayElement.style.left) || 0;
          
          // Apply scroll offset
          overlayElement.style.top = `${originalY - scrollY}px`;
          overlayElement.style.left = `${originalX - scrollX}px`;
        }
      });
      
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking && this.overlays.size > 0) {
        requestAnimationFrame(updateOverlayPositions);
        ticking = true;
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Also listen for resize to handle responsive layout changes
    window.addEventListener('resize', onScroll, { passive: true });
  }

  private initializeGlobalStyles(): void {
    const styleId = "fe-dev-tools-overlay-styles";
    if (document.getElementById(styleId)) return;

    const addStylesWhenReady = () => {
      if (!document.head) {
        setTimeout(addStylesWhenReady, 10);
        return;
      }

      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        [id^="fe-dev-tools-overlay-"] {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 12px !important;
        }
        
        .fe-dev-tools-overlay-container {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        #fe-dev-tools-menu-container {
          position: fixed !important;
          bottom: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          opacity: 0.95 !important;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
          z-index: 999999 !important;
          pointer-events: auto !important;
          background: rgba(28, 28, 30, 0.72) !important;
          backdrop-filter: blur(40px) saturate(180%) !important;
          border-radius: 20px !important;
          padding: 10px 20px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          min-width: 280px !important;
          justify-content: center !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          border: 0.5px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        #fe-dev-tools-menu-container:hover {
          opacity: 1 !important;
          transform: translateX(-50%) translateY(-2px) !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        
        .fe-dev-tools-toolbar-btn {
          background: rgba(120, 120, 128, 0.16) !important;
          color: rgba(255, 255, 255, 0.9) !important;
          border: none !important;
          border-radius: 12px !important;
          width: 36px !important;
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          font-size: 16px !important;
          transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
          backdrop-filter: blur(20px) !important;
          position: relative !important;
        }
        
        .fe-dev-tools-toolbar-btn:hover {
          background: rgba(120, 120, 128, 0.24) !important;
          transform: scale(1.08) !important;
          color: rgba(255, 255, 255, 1) !important;
        }
        
        .fe-dev-tools-toolbar-btn:active {
          transform: scale(0.95) !important;
          transition: all 0.1s ease !important;
        }
        
        .fe-dev-tools-delete-btn {
          background: rgba(255, 59, 48, 0.16) !important;
        }
        
        .fe-dev-tools-delete-btn:hover {
          background: rgba(255, 59, 48, 0.24) !important;
          color: rgba(255, 255, 255, 1) !important;
        }
        
        .fe-dev-tools-opacity-container {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          background: rgba(120, 120, 128, 0.16) !important;
          padding: 8px 12px !important;
          border-radius: 12px !important;
          backdrop-filter: blur(20px) !important;
        }
        
        .fe-dev-tools-opacity-slider {
          width: 70px !important;
          height: 3px !important;
          background: rgba(255, 255, 255, 0.2) !important;
          border-radius: 2px !important;
          outline: none !important;
          -webkit-appearance: none !important;
          cursor: pointer !important;
        }
        
        .fe-dev-tools-opacity-slider::-webkit-slider-thumb {
          -webkit-appearance: none !important;
          width: 16px !important;
          height: 16px !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
          transition: all 0.2s ease !important;
        }
        
        .fe-dev-tools-opacity-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1) !important;
          background: rgba(255, 255, 255, 1) !important;
        }
        
        .fe-dev-tools-layer-info {
          color: rgba(255, 255, 255, 0.9) !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          background: rgba(120, 120, 128, 0.16) !important;
          padding: 8px 12px !important;
          border-radius: 12px !important;
          white-space: nowrap !important;
          backdrop-filter: blur(20px) !important;
          letter-spacing: -0.08px !important;
        }
        
        .fe-dev-tools-layer-count {
          font-weight: 500 !important;
          display: flex !important;
          align-items: center !important;
        }
        
      `;

      document.head.appendChild(style);
    };

    addStylesWhenReady();
  }
}
