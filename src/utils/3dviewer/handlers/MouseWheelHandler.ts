import { Viewer3DEventHandler } from "../Viewer3DEventHandler";

/**
 * Handles mouse wheel events for camera zoom
 */
export class MouseWheelHandler extends Viewer3DEventHandler {
  private onWheelCallback: ((delta: number) => void) | null = null;

  constructor(onWheel: (delta: number) => void) {
    super();
    this.onWheelCallback = onWheel;
  }

  protected getEventType(): string {
    return "wheel";
  }

  protected getEventCallback(): (e: Event) => void {
    return this.onMouseWheel;
  }

  protected getTarget(): HTMLElement | Window {
    return this.viewer3D?.getRenderer()?.domElement || window;
  }

  /**
   * Override attach to use passive: false for wheel events
   */
  override attach(): void {
    if (this.attached) return;

    const target = this.getTarget();
    target.addEventListener(this.getEventType(), this.onMouseWheel, { passive: false });

    this.attached = true;
  }

  private onMouseWheel = (e: Event): void => {
    if (!(e instanceof WheelEvent)) return;
    if (!this.onWheelCallback) return;

    e.preventDefault();

    const zoomSpeed = 0.1;
    const direction = e.deltaY > 0 ? 1 : -1;

    this.onWheelCallback(direction * zoomSpeed);
  };

  /**
   * Clean up resources
   */
  override dispose(): void {
    this.detach();
    this.onWheelCallback = null;
    super.dispose();
  }
}
