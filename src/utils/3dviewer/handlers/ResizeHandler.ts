import { Viewer3DEventHandler } from "../Viewer3DEventHandler";

/**
 * Handles window resize events for camera and renderer updates
 */
export class ResizeHandler extends Viewer3DEventHandler {
  private onResizeCallback: ((width: number, height: number) => void) | null = null;

  constructor(onResize: (width: number, height: number) => void) {
    super();
    this.onResizeCallback = onResize;
  }

  protected getEventType(): string {
    return "resize";
  }

  protected getEventCallback(): (e: Event) => void {
    return this.onWindowResize;
  }

  protected getTarget(): HTMLElement | Window {
    return window;
  }

  private onWindowResize = (): void => {
    if (!this.onResizeCallback) return;

    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    this.onResizeCallback(newWidth, newHeight);

    // Also resize the renderer
    const renderer = this.viewer3D?.getRenderer();
    if (renderer) {
      renderer.setSize(newWidth, newHeight);
    }
  };

  /**
   * Clean up resources
   */
  override dispose(): void {
    this.detach();
    this.onResizeCallback = null;
    super.dispose();
  }
}
