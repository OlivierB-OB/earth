import { Mesh, Raycaster } from "three";
import { Viewer3DEventHandler } from "../Viewer3DEventHandler";
import { CoordinateConverter } from "../utils/CoordinateConverter";

/**
 * Handles mouse click events for Earth location selection.
 *
 * Features:
 * - Distinguishes between clicks and drags using mousedown/mouseup tracking
 * - Uses Three.js Raycaster to detect intersection with Earth sphere
 * - Converts 3D intersection point to geographic coordinates (lat/lng)
 * - Triggers callback only on valid Earth intersections
 *
 * The click/drag detection works by:
 * 1. Recording mouse position on mousedown
 * 2. Comparing mouseup position - if delta > 5px, it's considered a drag, not a click
 * 3. Only valid clicks on Earth trigger the callback
 */
export class MouseClickHandler extends Viewer3DEventHandler {
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private onClickCallback:
    | ((latitude: number, longitude: number) => void)
    | null = null;
  private raycaster: Raycaster | null = null;

  constructor(onClick: (latitude: number, longitude: number) => void) {
    super();
    this.onClickCallback = onClick;
    this.raycaster = new Raycaster();
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

  /**
   * Handle mouse release event.
   *
   * Process:
   * 1. Check if release was a click (not a drag) - threshold is 5px movement
   * 2. Convert screen coordinates to normalized device coordinates for raycasting
   * 3. Find the textured Earth mesh by traversing the scene
   * 4. Cast a ray from camera through mouse position
   * 5. Test intersection with Earth mesh
   * 6. If hit, convert intersection point to geographic coordinates and fire callback
   */
  private onMouseUp = (e: Event): void => {
    if (!(e instanceof MouseEvent)) return;
    if (!this.onClickCallback || !this.raycaster) return;

    // Check if it was a click (not a drag)
    const deltaX = Math.abs(e.clientX - this.previousMousePosition.x);
    const deltaY = Math.abs(e.clientY - this.previousMousePosition.y);

    if (deltaX >= 5 || deltaY >= 5) {
      // This was a drag, not a click - ignore
      return;
    }

    // Convert mouse position to normalized device coordinates for raycasting
    const renderer = this.viewer.renderer;
    if (!renderer) return;

    const rect = renderer.object.domElement.getBoundingClientRect();
    const mouse = CoordinateConverter.mouseToNormalizedDeviceCoords(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );

    // Create a ray from camera through the mouse position
    const camera = this.viewer.camera.object;
    if (!camera) return;

    this.raycaster.setFromCamera(mouse, camera);

    const scene = this.viewer.scene;
    if (!scene) return;

    // Find Earth mesh - identified by having a texture map (child.material?.map)
    // Scene.traverse() recursively visits all objects in the scene
    let earthMesh: Mesh | null = null;
    scene.object.traverse((child) => {
      if (child instanceof Mesh && !earthMesh && child.material?.map) {
        earthMesh = child;
      }
    });

    if (!earthMesh) return;

    // Test ray intersection with Earth - gets all intersection points sorted by distance
    const intersects = this.raycaster.intersectObject(earthMesh);

    if (intersects.length > 0) {
      // Use the first (closest) intersection point
      const point = intersects[0].point.clone().normalize();
      const [latitude, longitude] =
        CoordinateConverter.position3DToLatLng(point);

      console.debug(`[User Control] Click on Earth at (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
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
    super.dispose();
  }
}
