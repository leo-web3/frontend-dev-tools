// Device Simulator - Creates device mockups on the page
import { DeviceSpec, getDeviceById } from "@/shared/deviceDatabase";

interface SimulatorState {
  enabled: boolean;
  currentDevice: DeviceSpec | null;
  scale: number;
}

export class DeviceSimulator {
  private state: SimulatorState = {
    enabled: false,
    currentDevice: null,
    scale: 0.8,
  };

  private simulatorContainer: HTMLElement | null = null;
  private deviceFrame: HTMLElement | null = null;
  private contentIframe: HTMLIFrameElement | null = null;
  private originalHtml: string = "";
  private controlPanel: HTMLElement | null = null;

  constructor() {
    this.createStyles();
  }

  public enable(deviceId: string = "iphone-15-pro"): void {
    if (this.state.enabled) return;

    const device = getDeviceById(deviceId);
    if (!device) return;

    this.state.enabled = true;
    this.state.currentDevice = device;
    this.originalHtml = document.documentElement.innerHTML;

    this.createSimulator();
    this.wrapPageInIframe();
  }

  public disable(): void {
    if (!this.state.enabled) return;

    this.state.enabled = false;
    this.state.currentDevice = null;

    this.removeSimulator();
    this.restoreOriginalPage();
  }

  public switchDevice(deviceId: string): void {
    if (!this.state.enabled) return;

    const device = getDeviceById(deviceId);
    if (!device) return;

    this.state.currentDevice = device;
    this.updateSimulator();
  }

  public setScale(scale: number): void {
    this.state.scale = Math.max(0.3, Math.min(1.2, scale));
    if (this.simulatorContainer) {
      this.simulatorContainer.style.transform = `translate(-50%, -50%) scale(${this.state.scale})`;
    }
  }

  private createStyles(): void {
    const styleId = "device-simulator-styles";
    if (document.getElementById(styleId)) return;

    const createStyleElement = () => {
      if (!document.head) {
        setTimeout(createStyleElement, 10);
        return;
      }

      const styles = document.createElement("style");
      styles.id = styleId;
      styles.textContent = `
        .device-simulator {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.8);
          z-index: 999999;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center center;
          user-select: none;
          pointer-events: auto;
        }

        .device-frame {
          position: relative;
          background: #1a1a1a;
          border-radius: 40px;
          padding: 4px;
          box-shadow: 
            0 0 0 8px #000,
            0 0 0 10px #333,
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 8px 25px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .device-frame.iphone {
          border-radius: 45px;
          background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
        }

        .device-frame.ipad {
          border-radius: 25px;
          background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
        }

        .device-frame.watch {
          border-radius: 20px;
          background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
        }

        .device-screen {
          position: relative;
          background: #000;
          border-radius: 35px;
          overflow: hidden;
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.1);
          height: 100%;
        }

        .device-frame.iphone .device-screen {
          border-radius: 35px;
        }

        .device-frame.ipad .device-screen {
          border-radius: 15px;
        }

        .device-frame.watch .device-screen {
          border-radius: 12px;
        }

        .device-notch {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 130px;
          height: 30px;
          background: #000;
          border-radius: 0 0 15px 15px;
          z-index: 10;
        }

        .device-notch.dynamic-island {
          width: 120px;
          height: 32px;
          border-radius: 16px;
          top: 8px;
        }

        .device-home-indicator {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 134px;
          height: 5px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
          z-index: 10;
        }

        .device-content {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: inherit;
          background: white;
        }

        .device-simulator-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          z-index: 999998;
          transition: opacity 0.3s ease;
        }

        .device-control-panel {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 15px;
          padding: 15px;
          z-index: 1000000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 200px;
        }

        .device-control-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .device-control-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .device-control-button.active {
          background: rgba(0, 122, 255, 0.8);
        }

        .device-scale-control {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          font-size: 12px;
        }

        .device-scale-slider {
          flex: 1;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.2);
          height: 4px;
          border-radius: 2px;
          outline: none;
        }

        .device-scale-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .device-info {
          color: rgba(255, 255, 255, 0.8);
          font-size: 11px;
          text-align: center;
          margin-bottom: 5px;
        }
      `;

      document.head.appendChild(styles);
    };

    createStyleElement();
  }

  private createSimulator(): void {
    if (!this.state.currentDevice) return;

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "device-simulator-overlay";
    document.body.appendChild(overlay);

    // Create simulator container
    this.simulatorContainer = document.createElement("div");
    this.simulatorContainer.className = "device-simulator";
    
    // Apply current scale
    this.simulatorContainer.style.transform = `translate(-50%, -50%) scale(${this.state.scale})`;

    // Create device frame
    this.deviceFrame = document.createElement("div");
    this.deviceFrame.className = `device-frame ${this.getDeviceCategory()}`;

    // Set device dimensions
    const { viewport } = this.state.currentDevice;
    this.deviceFrame.style.width = `${viewport.width}px`;
    this.deviceFrame.style.height = `${viewport.height}px`;

    // Create screen
    const screen = document.createElement("div");
    screen.className = "device-screen";

    // Add device-specific elements
    this.addDeviceElements(screen);

    // Create iframe for content
    this.contentIframe = document.createElement("iframe");
    this.contentIframe.className = "device-content";
    this.contentIframe.src = window.location.href;

    screen.appendChild(this.contentIframe);
    this.deviceFrame.appendChild(screen);
    this.simulatorContainer.appendChild(this.deviceFrame);

    // Create control panel
    this.createControlPanel();

    document.body.appendChild(this.simulatorContainer);
  }

  private addDeviceElements(screen: HTMLElement): void {
    if (!this.state.currentDevice) return;

    const { features = [] } = this.state.currentDevice;

    // Add notch or dynamic island for iPhones
    if (this.state.currentDevice.brand === "iPhone") {
      const notch = document.createElement("div");

      if (features.includes("Dynamic Island")) {
        notch.className = "device-notch dynamic-island";
      } else if (features.includes("Notch")) {
        notch.className = "device-notch";
      }

      if (notch.className) {
        screen.appendChild(notch);
      }

      // Add home indicator for newer iPhones
      if (!features.includes("Touch ID")) {
        const homeIndicator = document.createElement("div");
        homeIndicator.className = "device-home-indicator";
        screen.appendChild(homeIndicator);
      }
    }
  }

  private createControlPanel(): void {
    this.controlPanel = document.createElement("div");
    this.controlPanel.className = "device-control-panel";

    // Device info
    const info = document.createElement("div");
    info.className = "device-info";
    info.textContent = this.state.currentDevice?.name || "";
    this.controlPanel.appendChild(info);

    // Scale control
    const scaleControl = document.createElement("div");
    scaleControl.className = "device-scale-control";

    const scaleLabel = document.createElement("span");
    scaleLabel.textContent = "Scale:";

    const scaleSlider = document.createElement("input");
    scaleSlider.type = "range";
    scaleSlider.className = "device-scale-slider";
    scaleSlider.min = "0.3";
    scaleSlider.max = "1.2";
    scaleSlider.step = "0.1";
    scaleSlider.value = this.state.scale.toString();

    const scaleValue = document.createElement("span");
    scaleValue.textContent = `${Math.round(this.state.scale * 100)}%`;

    scaleSlider.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const scale = parseFloat(target.value);
      this.setScale(scale);
      scaleValue.textContent = `${Math.round(scale * 100)}%`;
    });

    scaleControl.appendChild(scaleLabel);
    scaleControl.appendChild(scaleSlider);
    scaleControl.appendChild(scaleValue);
    this.controlPanel.appendChild(scaleControl);

    // Device selection buttons
    const quickDevices = [
      "iphone-15-pro",
      "iphone-14",
      "ipad-pro-11-m2",
      "samsung-galaxy-s24-ultra",
    ];

    quickDevices.forEach((deviceId) => {
      const device = getDeviceById(deviceId);
      if (!device) return;

      const button = document.createElement("button");
      button.className = "device-control-button";
      if (this.state.currentDevice?.id === deviceId) {
        button.classList.add("active");
      }

      button.innerHTML = `
        ${this.getDeviceIcon(device.category)}
        ${device.name}
      `;

      button.addEventListener("click", () => {
        this.switchDevice(deviceId);
        // Update active state
        this.controlPanel?.querySelectorAll(".device-control-button").forEach((btn) => {
          btn.classList.remove("active");
        });
        button.classList.add("active");
      });

      this.controlPanel.appendChild(button);
    });

    // Close button
    const closeButton = document.createElement("button");
    closeButton.className = "device-control-button";
    closeButton.innerHTML = `❌ 关闭模拟器`;
    closeButton.addEventListener("click", () => {
      this.disable();
    });
    this.controlPanel.appendChild(closeButton);

    document.body.appendChild(this.controlPanel);
  }

  private getDeviceIcon(category: string): string {
    switch (category) {
      case "mobile":
        return "📱";
      case "tablet":
        return "📟";
      case "watch":
        return "⌚";
      case "desktop":
        return "🖥️";
      case "laptop":
        return "💻";
      default:
        return "📱";
    }
  }

  private getDeviceCategory(): string {
    if (!this.state.currentDevice) return "mobile";

    switch (this.state.currentDevice.brand) {
      case "iPhone":
        return "iphone";
      case "iPad":
        return "ipad";
      case "iWatch":
        return "watch";
      default:
        return this.state.currentDevice.category;
    }
  }

  private wrapPageInIframe(): void {
    // Hide original content
    document.body.style.overflow = "hidden";
  }

  private updateSimulator(): void {
    if (!this.deviceFrame || !this.state.currentDevice) return;

    // Update device frame class
    this.deviceFrame.className = `device-frame ${this.getDeviceCategory()}`;

    // Update dimensions
    const { viewport } = this.state.currentDevice;
    this.deviceFrame.style.width = `${viewport.width}px`;
    this.deviceFrame.style.height = `${viewport.height}px`;

    // Update device-specific elements
    const screen = this.deviceFrame.querySelector(".device-screen");
    if (screen) {
      // Clear existing device elements
      screen.querySelectorAll(".device-notch, .device-home-indicator").forEach((el) => el.remove());
      this.addDeviceElements(screen as HTMLElement);
    }

    // Update control panel info
    if (this.controlPanel) {
      const info = this.controlPanel.querySelector(".device-info");
      if (info) {
        info.textContent = this.state.currentDevice.name;
      }
    }
  }

  private removeSimulator(): void {
    // Remove simulator elements
    this.simulatorContainer?.remove();
    this.controlPanel?.remove();
    document.querySelector(".device-simulator-overlay")?.remove();

    // Clean up references
    this.simulatorContainer = null;
    this.deviceFrame = null;
    this.contentIframe = null;
    this.controlPanel = null;
  }

  private restoreOriginalPage(): void {
    document.body.style.overflow = "";
  }

  public getState(): SimulatorState {
    return { ...this.state };
  }
}
