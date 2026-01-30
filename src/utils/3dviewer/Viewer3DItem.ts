import type { Object3D, WebGLRenderer } from "three";
import type { IViewer3D } from "./IViewer3D";
import { IViewer3DItem } from "./IViewer3DItem";

/**
 * Abstract base class for composable 3D scene components
 * Extends FlatMapLayer pattern to Three.js world
 *
 * Each scene component wraps a specific THREE.Object3D and manages its lifecycle
 */
export abstract class Viewer3DItem<
  T extends Object3D | WebGLRenderer = Object3D,
> implements IViewer3DItem<T> {
  private _viewer: IViewer3D | null = null;
  protected _object: T | null = null;
  protected initialized: boolean = false;

  get viewer(): IViewer3D {
    if (!this._viewer) throw Error("Viewer3DItem not initialized");
    return this._viewer;
  }

  get object(): T {
    if (!this._object) throw Error("Viewer3DItem not initialized");
    return this._object;
  }

  /**
   * Receive the Viewer3D instance (IoC injection)
   */
  init(viewer: IViewer3D): void {
    if (this.initialized) {
      throw Error("Viewer3DItem already initialized");
    }

    this._viewer = viewer;
    this._object = this.makeObject();
  }

  /**
   * Clean up resources (geometries, materials, textures, etc.)
   */
  dispose(): void {
    this._viewer = null;
    this._object = null;
    this.initialized = false;
  }

  /**
   * Create and return the Three.js Object3D instance for this scene item
   * Subclasses must implement this to define what 3D object to render
   * @returns The THREE.Object3D instance (or subclass) specific to this item
   */
  protected abstract makeObject(): T;
}
