import type { Scene } from "three";
import type { IViewer3DItem } from "./IViewer3DItem";
import type { Viewer3DSceneItem } from "./Viewer3DSceneItem";

/**
 * Interface for the 3D scene component
 * Manages the lifecycle of all scene items added to it
 */
export interface IViewer3DScene extends IViewer3DItem<Scene> {
  /**
   * Initialize all scene items
   */
  refresh(): void;

  /**
   * Add a scene item with IoC initialization
   */
  addItem(component: Viewer3DSceneItem): void;

  /**
   * Remove a scene item
   */
  removeItem(item: Viewer3DSceneItem): void;
}
