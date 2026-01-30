import { Mesh, Raycaster, Vector2 } from "three";
import { Viewer3DEventHandler } from "../Viewer3DEventHandler";
import { CoordinateConverter } from "../utils/CoordinateConverter";

/**
 * Handles mouse click events for Earth location selection
 * Uses raycasting to detect intersection with Earth sphere
 */
export class MouseClickHandler extends Viewer3DEventHandler {
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private onClickCallback:
    | ((latitude: number, longitude: number) => void)
    | null = null;
  private raycaster: Raycaster | null = null;
  private mouse: Vector2 | null = null;

  constructor(onClick: (latitude: number, longitude: number) => void) {
    super();
    this.onClickCallback = onClick;
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
  }

  protected getEventType(): string {
    return "mouseup";
  }

  protected getEventCallback(): (e: Event) => void {
    return this.onMouseUp;
  }

  protected getTarget(): HTMLElement | Window {
    return this.viewer.renderer.object.domElement || window;
  }

  /**
   * Override attach to also listen for mousedown
   */
  override attach(): void {
    if (this.attached) return;

    const target = this.getTarget();
    target.addEventListener("mousedown", this.onMouseDown);
    target.addEventListener("mouseup", this.onMouseUp);

    this.attached = true;
  }

  /**
   * Override detach
   */
  override detach(): void {
    if (!this.attached) return;

    const target = this.getTarget();
    target.removeEventListener("mousedown", this.onMouseDown);
    target.removeEventListener("mouseup", this.onMouseUp);

    this.attached = false;
  }

  private onMouseDown = (e: Event): void => {
    if (!(e instanceof MouseEvent)) return;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  private onMouseUp = (e: Event): void => {
    if (!(e instanceof MouseEvent)) return;
    if (!this.onClickCallback || !this.raycaster || !this.mouse) return;

    // Check if it was a click (not a drag)
    const deltaX = Math.abs(e.clientX - this.previousMousePosition.x);
    const deltaY = Math.abs(e.clientY - this.previousMousePosition.y);

    if (deltaX >= 5 || deltaY >= 5) {
      // This was a drag, not a click
      return;
    }

    // Convert mouse position to normalized device coordinates
    const renderer = this.viewer.renderer;
    if (!renderer) return;

    const rect = renderer.object.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycasting to find intersection with Earth
    const camera = this.viewer.camera.object;
    if (!camera) return;

    this.raycaster.setFromCamera(this.mouse, camera);

    const scene = this.viewer.scene;
    if (!scene) return;

    // Find Earth mesh (should be in the Earth layer)
    let earthMesh: Mesh | null = null;
    scene.object.traverse((child) => {
      if (child instanceof Mesh && !earthMesh && child.material?.map) {
        earthMesh = child;
      }
    });

    if (!earthMesh) return;

    const intersects = this.raycaster.intersectObject(earthMesh);

    if (intersects.length > 0) {
      const point = intersects[0].point.clone().normalize();
      const [latitude, longitude] =
        CoordinateConverter.position3DToLatLng(point);

      this.onClickCallback(latitude, longitude);
    }
  };

  /**
   * Clean up resources
   */
  override dispose(): void {
    this.detach();
    this.onClickCallback = null;
    this.raycaster = null;
    this.mouse = null;
    super.dispose();
  }
}
