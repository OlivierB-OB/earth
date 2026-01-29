import type { IViewer3D } from "./IViewer3D";
import type { IViewer3DEventHandler } from "./IViewer3DEventHandler";

/**
 * Abstract base class for composable event handlers
 * Extends FlatMapEventHandler pattern to Three.js event handling
 */
export abstract class Viewer3DEventHandler implements IViewer3DEventHandler {
  protected viewer3D: IViewer3D | null = null;
  protected attached: boolean = false;

  /**
   * Receive the Viewer3D instance (IoC injection)
   */
  init(viewer3D: IViewer3D): void {
    this.viewer3D = viewer3D;
  }

  /**
   * Get the event type to listen for (e.g., "click", "mousemove", "wheel")
   */
  protected abstract getEventType(): string;

  /**
   * Get the event handler function
   */
  protected abstract getEventCallback(): (e: Event) => void;

  /**
   * Get the target element to attach the listener to
   */
  protected abstract getTarget(): HTMLElement | Window;

  /**
   * Attach the event listener to its target
   */
  attach(): void {
    if (this.attached) return;

    const target = this.getTarget();
    const eventType = this.getEventType();
    const callback = this.getEventCallback();

    // For wheel and resize events, we need to use the passive option
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {};
    if (eventType === "wheel") {
      options.passive = false;
    }

    target.addEventListener(eventType, callback, options);
    this.attached = true;
  }

  /**
   * Detach the event listener
   */
  detach(): void {
    if (!this.attached) return;

    const target = this.getTarget();
    const eventType = this.getEventType();
    const callback = this.getEventCallback();

    target.removeEventListener(eventType, callback);
    this.attached = false;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.detach();
    this.viewer3D = null;
  }
}
