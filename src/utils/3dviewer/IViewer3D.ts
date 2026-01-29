import * as THREE from "three";
import type { Viewer3DSceneBase } from "./Viewer3DSceneBase";
import type { Viewer3DEventHandler } from "./Viewer3DEventHandler";

export interface IViewer3D {
  /**
   * Initialize the 3D viewer with a DOM container
   * Sets up renderer, scene, all components, and starts the render loop
   */
  init(domRef: HTMLDivElement): void;

  /**
   * Add a scene component to the viewer (with IoC initialization)
   */
  addSceneComponent(component: Viewer3DSceneBase<THREE.Object3D>): void;

  /**
   * Remove a scene component from the viewer
   */
  removeSceneComponent(component: Viewer3DSceneBase<THREE.Object3D>): void;

  /**
   * Add an event handler to the viewer (with IoC initialization)
   */
  addEventHandler(handler: Viewer3DEventHandler): void;

  /**
   * Remove an event handler from the viewer
   */
  removeEventHandler(handler: Viewer3DEventHandler): void;

  /**
   * Re-render all scene components
   */
  render(): void;

  /**
   * Get the THREE.Scene instance
   */
  getScene(): THREE.Scene | null;

  /**
   * Get the THREE.Camera instance
   */
  getCamera(): THREE.Camera | null;

  /**
   * Get the THREE.WebGLRenderer instance
   */
  getRenderer(): THREE.WebGLRenderer | null;

  /**
   * Complete cleanup - dispose all resources and stop render loop
   */
  dispose(): void;
}
