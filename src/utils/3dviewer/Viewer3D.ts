import type { IViewer3D } from "./IViewer3D";
import type { Viewer3DEventHandler } from "./Viewer3DEventHandler";
import type { IViewer3DScene } from "./IViewer3DScene";
import type { IViewer3DCamera } from "./IViewer3DCamera";
import type { IViewer3DRenderer } from "./IViewer3DRenderer";
import { Viewer3DRenderer } from "./Viewer3DRenderer";
import { Viewer3DScene } from "./Viewer3DScene";
import { Viewer3DCamera } from "./Viewer3DCamera";

/**
 * Main facade for 3D viewer using Three.js
 * Encapsulates renderer, scene, and component lifecycle management
 * Uses IoC pattern for scene components and event handlers
 */
export class Viewer3D implements IViewer3D {
  private _domRef: HTMLDivElement | null = null;
  private eventHandlers: Set<Viewer3DEventHandler> = new Set();
  private isInitialized: boolean = false;

  constructor(
    public readonly renderer: IViewer3DRenderer = new Viewer3DRenderer(),
    public readonly scene: IViewer3DScene = new Viewer3DScene(),
    public readonly camera: IViewer3DCamera = new Viewer3DCamera()
  ) {}

  get domRef(): HTMLDivElement {
    if (!this._domRef) throw Error("item not initialized");
    return this._domRef;
  }

  /**
   * Initialize the viewer with a DOM container
   */
  init(domRef: HTMLDivElement): void {
    if (this.isInitialized) {
      console.warn("Viewer3D already initialized");
      return;
    }

    this._domRef = domRef;

    this.camera.init(this);
    this.scene.init(this);
    this.renderer.init(this);
    this.scene.refresh();

    // Attach all event handlers (which triggers their init and attach)
    this.eventHandlers.forEach((handler) => {
      if (!handler) return;
      // IoC: inject this viewer into handler
      handler.init(this);
      // Attach handler to event targets
      handler.attach();
    });

    this.isInitialized = true;
  }

  /**
   * Add an event handler with IoC initialization
   */
  addEventHandler(handler: Viewer3DEventHandler): void {
    this.eventHandlers.add(handler);

    // If already initialized, init and attach immediately
    if (this.isInitialized) {
      handler.init(this);
      handler.attach();
    }
  }

  /**
   * Remove an event handler
   */
  removeEventHandler(handler: Viewer3DEventHandler): void {
    if (this.eventHandlers.has(handler)) {
      handler.dispose();
      this.eventHandlers.delete(handler);
    }
  }

  /**
   * Complete cleanup
   */
  dispose(): void {
    // Dispose all event handlers
    this.eventHandlers.forEach((handler) => {
      handler.dispose();
    });
    this.eventHandlers.clear();

    // Dispose scene, camera, and renderer
    this.renderer.dispose();
    this.scene.dispose();
    this.camera.dispose();

    this._domRef = null;
    this.isInitialized = false;
  }
}
