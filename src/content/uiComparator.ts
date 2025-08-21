import { ExtensionResponse, UIOverlay } from "@/shared/types";

export class UIComparator {
  private overlayData: Map<string, UIOverlay> = new Map(); // Store overlay data instead of DOM elements
  private currentOverlayElement: HTMLElement | null = null; // Single overlay element
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
      // Wait for document.body to be available
      const appendOverlayWhenReady = () => {
        return new Promise<void>((resolve) => {
          const checkBodyReady = () => {
            if (document.body) {
              // Create global menu if it doesn't exist
              if (!this.globalMenuContainer) {
                this.createGlobalMenuContainer();
              }

              // Store overlay data
              this.overlayData.set(overlayData.id, overlayData);

              // If this overlay is visible, hide other overlays and show this one
              if (overlayData.visible) {
                // Hide other visible overlays
                this.overlayData.forEach((data, id) => {
                  if (id !== overlayData.id && data.visible) {
                    this.overlayData.set(id, { ...data, visible: false });
                  }
                });

                const overlayWrapper = this.createOrUpdateOverlayElement(overlayData);
                this.currentOverlayElement = overlayWrapper;

                // Add to DOM if not already there
                if (!document.body.contains(overlayWrapper)) {
                  document.body.appendChild(overlayWrapper);
                }
              }

              // Update menu visibility and refresh layer menu
              this.updateGlobalMenuVisibility();
              this.refreshLayerMenu();

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
      const overlayData = this.overlayData.get(id);
      if (!overlayData) {
        return {
          success: false,
          error: "Overlay not found",
        };
      }

      // Update overlay data
      const updatedOverlay = { ...overlayData, ...updates };
      this.overlayData.set(id, updatedOverlay);

      // Handle visibility changes
      if (updates.hasOwnProperty("visible")) {
        if (updates.visible) {
          // Show this overlay: hide other visible overlays first
          this.overlayData.forEach((data, otherId) => {
            if (otherId !== id && data.visible) {
              this.overlayData.set(otherId, { ...data, visible: false });
            }
          });

          // Show this overlay
          const overlayElement = this.createOrUpdateOverlayElement(updatedOverlay);
          this.currentOverlayElement = overlayElement;

          if (!document.body.contains(overlayElement)) {
            document.body.appendChild(overlayElement);
          }
        } else {
          // Hide: remove the overlay if it's currently showing
          if (this.currentOverlayElement && document.body.contains(this.currentOverlayElement)) {
            this.currentOverlayElement.remove();
            this.currentOverlayElement = null;
          }
        }
      } else if (this.currentOverlayElement && overlayData.visible) {
        // Update the current overlay if it's the visible one
        this.applyUpdatesToElement(this.currentOverlayElement, updates);
      }

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
      const overlayData = this.overlayData.get(id);
      if (overlayData) {
        // If this is the visible overlay, remove it from DOM
        if (overlayData.visible && this.currentOverlayElement) {
          this.currentOverlayElement.remove();
          this.currentOverlayElement = null;
        }

        // Remove from data storage
        this.overlayData.delete(id);
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
      const overlayData = this.overlayData.get(id);
      if (!overlayData) {
        console.error(`[Content] Overlay ${id} not found in overlayData`);
        return {
          success: false,
          error: "Overlay not found",
        };
      }

      // Update the overlay data
      const newVisible = !overlayData.visible;
      const updatedOverlay = { ...overlayData, visible: newVisible };
      this.overlayData.set(id, updatedOverlay);

      // If this overlay becomes visible, hide others and show this one
      if (newVisible) {
        // Hide other visible overlays and notify background script
        const otherVisibleIds: string[] = [];
        this.overlayData.forEach((data, otherId) => {
          if (otherId !== id && data.visible) {
            this.overlayData.set(otherId, { ...data, visible: false });
            otherVisibleIds.push(otherId);
          }
        });

        // Notify background script to update storage for hidden overlays
        otherVisibleIds.forEach((otherId) => {
          chrome.runtime.sendMessage(
            {
              type: "UPDATE_OVERLAY",
              payload: {
                id: otherId,
                updates: { visible: false },
              },
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  `[Content] UPDATE_OVERLAY message failed for ${otherId}:`,
                  chrome.runtime.lastError.message
                );
              } else {
              }
            }
          );
        });

        // Show this overlay
        const overlayElement = this.createOrUpdateOverlayElement(updatedOverlay);
        this.currentOverlayElement = overlayElement;

        if (!document.body.contains(overlayElement)) {
          document.body.appendChild(overlayElement);
        }
      } else {
        // Hide the overlay
        if (this.currentOverlayElement && document.body.contains(this.currentOverlayElement)) {
          this.currentOverlayElement.remove();
          this.currentOverlayElement = null;
        }
      }

      return {
        success: true,
        data: `Overlay ${id} ${newVisible ? "shown" : "hidden"}`,
      };
    } catch (error) {
      console.error("[Content] Failed to toggle overlay visibility:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle visibility",
      };
    }
  }

  clearAllOverlays(): void {
    // Remove the overlay element from DOM
    if (this.currentOverlayElement) {
      this.currentOverlayElement.remove();
      this.currentOverlayElement = null;
    }

    // Clear all overlay data
    this.overlayData.clear();

    // Hide global menu and refresh layer info
    this.updateGlobalMenuVisibility();
    this.refreshLayerMenu();
  }

  adjustOverlaysToPageChanges(): void {
    // Re-adjust overlay if the page layout changes
    if (this.currentOverlayElement && document.body) {
      // Ensure overlay is still properly positioned
      if (this.currentOverlayElement.parentNode !== document.body) {
        document.body.appendChild(this.currentOverlayElement);
      }
    }
  }

  private createOrUpdateOverlayElement(overlayData: UIOverlay): HTMLElement {
    // Check if the single overlay element already exists
    let wrapper = document.getElementById("fe-dev-tools-overlay") as HTMLElement;

    if (!wrapper) {
      // Create the single overlay element
      wrapper = document.createElement("div");
      wrapper.id = "fe-dev-tools-overlay";
    } else {
      // Clear existing content
      wrapper.innerHTML = "";
    }

    // Create overlay container for image
    const container = document.createElement("div");
    container.className = "fe-dev-tools-overlay-container";

    // Create image element
    const img = document.createElement("img");
    img.src = overlayData.imageUrl;
    img.alt = "UI Comparison Overlay";
    img.draggable = false;

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
  }

  private updateGlobalMenuVisibility(): void {
    if (this.globalMenuContainer) {
      const hasOverlays = this.overlayData.size > 0;
      this.globalMenuContainer.style.display = hasOverlays ? "block" : "none";
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
      if (this.currentOverlayElement) {
        this.currentOverlayElement.style.opacity = opacity.toString();
      }
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
    const layerInfo = this.globalMenuContainer?.querySelector(
      "#fe-dev-tools-layer-info"
    ) as HTMLElement;
    if (!layerInfo) return;

    if (this.overlayData.size === 0) {
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

    // Count visible overlays
    const visibleCount = Array.from(this.overlayData.values()).filter(
      (data) => data.visible
    ).length;

    // Create the main clickable layer info
    layerInfo.innerHTML = `
      <div class="fe-dev-tools-layer-toggle" data-expanded="false">
        <span class="fe-dev-tools-layer-count">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 4px;">
            <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" opacity="0.3"/>
            <rect x="2" y="6" width="12" height="2" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="2" y="9" width="12" height="2" rx="1" fill="currentColor" opacity="0.9"/>
            <rect x="2" y="12" width="12" height="2" rx="1" fill="currentColor"/>
          </svg>
          ${this.overlayData.size} 层 (${visibleCount} 可见)
        </span>
        <svg class="fe-dev-tools-expand-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" style="margin-left: 8px; transition: transform 0.2s;">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="fe-dev-tools-layer-list" style="display: none;"></div>
    `;

    // Add click handler for toggle
    const toggleElement = layerInfo.querySelector(".fe-dev-tools-layer-toggle") as HTMLElement;
    const layerList = layerInfo.querySelector(".fe-dev-tools-layer-list") as HTMLElement;
    const expandIcon = layerInfo.querySelector(".fe-dev-tools-expand-icon") as HTMLElement;

    if (toggleElement && layerList && expandIcon) {
      toggleElement.addEventListener("click", (e) => {
        e.stopPropagation();
        const isExpanded = toggleElement.getAttribute("data-expanded") === "true";

        if (isExpanded) {
          // Collapse
          toggleElement.setAttribute("data-expanded", "false");
          layerList.style.display = "none";
          expandIcon.style.transform = "rotate(0deg)";
        } else {
          // Expand
          toggleElement.setAttribute("data-expanded", "true");
          layerList.style.display = "block";
          expandIcon.style.transform = "rotate(180deg)";
          this.updateLayerList();
        }
      });
    }
  }

  private updateLayerList(): void {
    const layerList = this.globalMenuContainer?.querySelector(
      ".fe-dev-tools-layer-list"
    ) as HTMLElement;
    if (!layerList) return;

    // Clear existing list
    layerList.innerHTML = "";

    // Create list items for each overlay
    Array.from(this.overlayData.entries()).forEach(([id, data]) => {
      const listItem = document.createElement("div");
      listItem.className = "fe-dev-tools-layer-item";
      listItem.setAttribute("data-layer-id", id);

      const shortId = id.slice(-4);
      const isVisible = data.visible;

      listItem.innerHTML = `
        <div class="fe-dev-tools-layer-item-content">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="fe-dev-tools-layer-icon">
            ${
              isVisible
                ? '<path d="M8 3C4.5 3 1.5 5.5 0 8C1.5 10.5 4.5 13 8 13C11.5 13 14.5 10.5 16 8C14.5 5.5 11.5 3 8 3ZM8 11C6.5 11 5 9.5 5 8C5 6.5 6.5 5 8 5C9.5 5 11 6.5 11 8C11 9.5 9.5 11 8 11ZM8 6.5C7.2 6.5 6.5 7.2 6.5 8C6.5 8.8 7.2 9.5 8 9.5C8.8 9.5 9.5 8.8 9.5 8C9.5 7.2 8.8 6.5 8 6.5Z" fill="currentColor"/>'
                : '<path d="M9.9 3.1C9.3 3.0 8.7 3.0 8.0 3.0C4.5 3.0 1.5 5.5 0 8.0C0.8 9.5 1.9 10.8 3.2 11.7L9.9 3.1ZM16 8.0C15.2 6.5 14.1 5.2 12.8 4.3L6.1 12.9C6.7 13.0 7.3 13.0 8.0 13.0C11.5 13.0 14.5 10.5 16 8.0ZM5.7 9.7C5.3 9.0 5.0 8.0 5.0 8.0C5.0 6.5 6.5 5.0 8.0 5.0C8.3 5.0 8.6 5.1 8.9 5.2L7.8 6.5C7.6 6.4 7.3 6.3 7.0 6.5C6.5 7.0 6.5 7.8 7.0 8.3L5.7 9.7Z" fill="currentColor"/>'
            }
          </svg>
          <span class="fe-dev-tools-layer-name">图层 ${shortId}</span>
          <span class="fe-dev-tools-layer-status ${isVisible ? "visible" : "hidden"}">${
        isVisible ? "显示中" : "隐藏"
      }</span>
        </div>
      `;

      // Add click handler for layer switching
      listItem.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleVisibility(id).then((result) => {
          // Update the layer list after switching
          this.updateLayerList();
        });
      });

      layerList.appendChild(listItem);
    });
  }

  private refreshLayerMenu(): void {
    this.updateLayerInfo();
  }

  private applyStylesAndProperties(wrapper: HTMLElement, overlayData: UIOverlay): void {
    const { position, size, opacity, visible, locked } = overlayData;

    // Store original position for scroll sync
    wrapper.setAttribute("data-original-left", position.x.toString());
    wrapper.setAttribute("data-original-top", position.y.toString());

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
    if (this.currentOverlayElement) {
      const isFrozen = this.currentOverlayElement.style.pointerEvents === "none";

      if (isFrozen) {
        // Unfreeze
        this.currentOverlayElement.style.pointerEvents = "auto";
        this.currentOverlayElement.style.cursor = "move";
        const container = this.currentOverlayElement.querySelector(
          ".fe-dev-tools-overlay-container"
        ) as HTMLElement;
        if (container) {
          container.style.border = "2px dashed rgba(59, 130, 246, 0.5)";
        }
      } else {
        // Freeze
        this.currentOverlayElement.style.pointerEvents = "none";
        this.currentOverlayElement.style.cursor = "default";
        const container = this.currentOverlayElement.querySelector(
          ".fe-dev-tools-overlay-container"
        ) as HTMLElement;
        if (container) {
          container.style.border = "2px solid rgba(34, 197, 94, 0.8)";
        }
      }
    }
  }

  private startDrag(e: MouseEvent, overlayId: string): void {
    if (this.dragState.isDragging) return;

    // Use the current overlay element instead of looking up by ID
    const element = this.currentOverlayElement;
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

      const element = this.currentOverlayElement;
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
        if (overlayId && this.currentOverlayElement) {
          const element = this.currentOverlayElement;
          if (element) {
            const newX = parseInt(element.style.left);
            const newY = parseInt(element.style.top);

            // Update original position for scroll sync
            element.setAttribute("data-original-left", newX.toString());
            element.setAttribute("data-original-top", newY.toString());

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
    if (this.currentOverlayElement) {
      const isVisible = this.currentOverlayElement.style.display !== "none";
      this.currentOverlayElement.style.display = isVisible ? "none" : "block";
    }
  }

  private hideAllOverlays(): void {
    if (this.currentOverlayElement) {
      this.currentOverlayElement.style.display = "none";
    }
  }

  private initializeScrollSync(): void {
    let ticking = false;

    const updateOverlayPositions = () => {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      if (this.currentOverlayElement) {
        // Only sync scroll for non-locked overlays
        if (this.currentOverlayElement.style.pointerEvents !== "none") {
          // Get original position (stored in data attributes or calculate from current style)
          const originalY =
            parseInt(
              this.currentOverlayElement.getAttribute("data-original-top") ||
                this.currentOverlayElement.style.top
            ) || 0;
          const originalX =
            parseInt(
              this.currentOverlayElement.getAttribute("data-original-left") ||
                this.currentOverlayElement.style.left
            ) || 0;

          // Apply scroll offset
          this.currentOverlayElement.style.top = `${originalY - scrollY}px`;
          this.currentOverlayElement.style.left = `${originalX - scrollX}px`;
        }
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking && this.currentOverlayElement) {
        requestAnimationFrame(updateOverlayPositions);
        ticking = true;
      }
    };

    // Add scroll listener
    window.addEventListener("scroll", onScroll, { passive: true });

    // Also listen for resize to handle responsive layout changes
    window.addEventListener("resize", onScroll, { passive: true });
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
          border-radius: 12px !important;
          backdrop-filter: blur(20px) !important;
          letter-spacing: -0.08px !important;
          position: relative !important;
        }
        
        .fe-dev-tools-layer-toggle {
          padding: 8px 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          white-space: nowrap !important;
        }
        
        .fe-dev-tools-layer-toggle:hover {
          background: rgba(120, 120, 128, 0.24) !important;
        }
        
        .fe-dev-tools-layer-count {
          font-weight: 500 !important;
          display: flex !important;
          align-items: center !important;
        }
        
        .fe-dev-tools-expand-icon {
          color: rgba(255, 255, 255, 0.7) !important;
          transition: transform 0.2s ease !important;
        }
        
        .fe-dev-tools-layer-list {
          position: absolute !important;
          bottom: 100% !important;
          left: 0 !important;
          right: 0 !important;
          background: rgba(28, 28, 30, 0.85) !important;
          backdrop-filter: blur(40px) saturate(180%) !important;
          border-radius: 12px !important;
          margin-bottom: 8px !important;
          border: 0.5px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          max-height: 240px !important;
          overflow-y: auto !important;
          z-index: 1000000 !important;
        }
        
        .fe-dev-tools-layer-item {
          padding: 10px 12px !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.05) !important;
        }
        
        .fe-dev-tools-layer-item:last-child {
          border-bottom: none !important;
        }
        
        .fe-dev-tools-layer-item:hover {
          background: rgba(120, 120, 128, 0.2) !important;
        }
        
        .fe-dev-tools-layer-item-content {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        
        .fe-dev-tools-layer-icon {
          color: rgba(255, 255, 255, 0.8) !important;
          flex-shrink: 0 !important;
        }
        
        .fe-dev-tools-layer-name {
          flex: 1 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }
        
        .fe-dev-tools-layer-status {
          font-size: 11px !important;
          padding: 2px 6px !important;
          border-radius: 6px !important;
          font-weight: 500 !important;
        }
        
        .fe-dev-tools-layer-status.visible {
          background: rgba(34, 197, 94, 0.2) !important;
          color: rgba(34, 197, 94, 1) !important;
        }
        
        .fe-dev-tools-layer-status.hidden {
          background: rgba(120, 120, 128, 0.2) !important;
          color: rgba(120, 120, 128, 1) !important;
        }
        
      `;

      document.head.appendChild(style);
    };

    addStylesWhenReady();
  }
}
