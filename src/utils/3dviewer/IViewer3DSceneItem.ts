import type { Object3D } from "three";
import type { IViewer3DScene } from "./IViewer3DScene";

export interface IViewer3DSceneItem<T extends Object3D = Object3D> {
  readonly scene: IViewer3DScene;

  readonly object: T;

  /**
   * Receive the Viewer3D instance (IoC injection)
   */
  init(scene: IViewer3DScene): void;

  /**
   * Create and add the object to the scene
   */
  render(): void;

  /**
   * Clean up resources (geometries, materials, textures, etc.)
   */
  dispose(): void;
}
