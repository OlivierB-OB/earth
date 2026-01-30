import { Viewer3DEventHandler } from "../Viewer3DEventHandler";

/**
 * Handles mouse drag events for Earth rotation
 * Listens to mousedown/mousemove/mouseup to detect and track dragging
 */
export class MouseDragHandler extends Viewer3DEventHandler {
  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private onDragCallback: ((deltaX: number, deltaY: number) => void) | null =
    null;
  private onDragEndCallback: (() => void) | null = null;

  constructor(
    onDrag: (deltaX: number, deltaY: number) => void,
    onDragEnd?: () => void
  ) {
    super();
    this.onDragCallback = onDrag;
    this.onDragEndCallback = onDragEnd || null;
  }

  protected getEventType(): string {
    // We handle mousedown, mousemove, mouseup - managed manually in getTarget
    return "mousedown";
  }

  protected getEventCallback(): (e: Event) => void {
    return () => {}; // Not used; we attach multiple listeners manually
  }

  protected getTarget(): HTMLElement | Window {
    return this.viewer.renderer.object.domElement || window;
  }

  /**
   * Override attach to handle multiple event types
   */
  override attach(): void {
    if (this.attached) return;

    const target = this.getTarget();

    target.addEventListener("mousedown", this.onMouseDown);
    target.addEventListener("mousemove", this.onMouseMove);
    target.addEventListener("mouseup", this.onMouseUp);

    this.attached = true;
  }

  /**
   * Override detach to remove all listeners
   */
  override detach(): void {
    if (!this.attached) return;

    const target = this.getTarget();

    target.removeEventListener("mousedown", this.onMouseDown);
    target.removeEventListener("mousemove", this.onMouseMove);
    target.removeEventListener("mouseup", this.onMouseUp);

    this.attached = false;
  }

  private onMouseDown = (e: Event): void => {
    if (!(e instanceof MouseEvent)) return;

    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  private onMouseMove = (e: Event): void => {
    if (!(e instanceof MouseEvent)) return;
    if (!this.isDragging || !this.onDragCallback) return;

    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    this.onDragCallback(deltaX, deltaY);

    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  private onMouseUp = (e: Event): void => {
    if (!(e instanceof MouseEvent)) return;

    this.isDragging = false;

    if (this.onDragEndCallback) {
      this.onDragEndCallback();
    }
  };

  /**
   * Check if currently dragging
   */
  isDraggingNow(): boolean {
    return this.isDragging;
  }

  /**
   * Clean up resources
   */
  override dispose(): void {
    this.detach();
    this.onDragCallback = null;
    this.onDragEndCallback = null;
    super.dispose();
  }
}
