import type { Object3D } from "three";
import type { IViewer3DScene } from "./IViewer3DScene";
import type { IViewer3DSceneItem } from "./IViewer3DSceneItem";

/**
 * Abstract base class for composable 3D scene components
 * Extends FlatMapLayer pattern to Three.js world
 *
 * Each scene component wraps a specific THREE.Object3D and manages its lifecycle
 */
export abstract class Viewer3DSceneItem<
  T extends Object3D = Object3D,
> implements IViewer3DSceneItem<T> {
  protected _scene: IViewer3DScene | null = null;
  protected _object: T | null = null;
  protected initialized: boolean = false;

  get scene(): IViewer3DScene {
    if (!this._scene) throw Error("Viewer3DSceneItem not initialized");
    return this._scene;
  }

  get object(): T {
    if (!this._object) throw Error("Viewer3DSceneItem not initialized");
    return this._object;
  }

  /**
   * Receive the Viewer3D instance (IoC injection)
   */
  init(scene: IViewer3DScene): void {
    this._scene = scene;
    this.initialized = true;
  }

  /**
   * Subclasses must implement this to define what object to create
   */
  protected abstract makeObject(): T;

  /**
   * Create and add the object to the scene
   */
  render(): void {
    if (!this.initialized) return;

    // Remove old object if it exists
    if (this._object) {
      if (this.scene.object.children.includes(this._object)) {
        this.scene.object.remove(this._object);
      }
    }

    // Create new object
    this._object = this.makeObject();

    // Add to scene
    this.scene.object.add(this.object);
  }

  /**
   * Clean up resources (geometries, materials, textures, etc.)
   */
  dispose(): void {
    if (this.object) {
      // Remove from scene
      this.scene.object.remove(this.object);
    }

    this._scene = null;
    this._object = null;
    this.initialized = false;
  }
}
