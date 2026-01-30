import type { Object3D, WebGLRenderer } from "three";
import type { IViewer3D } from "./IViewer3D";

/**
 * Interface for composable 3D scene components
 * Defines the contract for items that manage Three.js Object3D instances
 */
export interface IViewer3DItem<T extends Object3D | WebGLRenderer> {
  /**
   * Receive the Viewer3D instance (IoC injection)
   */
  init(viewer: IViewer3D): void;

  /**
   * Clean up resources (geometries, materials, textures, etc.)
   */
  dispose(): void;

  /**
   * Get the Viewer3D instance
   */
  readonly viewer: IViewer3D;

  /**
   * Get the Three.js Object3D instance
   */
  readonly object: T;
}
