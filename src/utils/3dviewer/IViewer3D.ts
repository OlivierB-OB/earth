import type { Viewer3DEventHandler } from "./Viewer3DEventHandler";
import type { IViewer3DScene } from "./IViewer3DScene";
import type { IViewer3DCamera } from "./IViewer3DCamera";
import type { IViewer3DRenderer } from "./IViewer3DRenderer";

export interface IViewer3D {
  readonly domRef: HTMLDivElement;
  readonly scene: IViewer3DScene;
  readonly camera: IViewer3DCamera;
  readonly renderer: IViewer3DRenderer;

  /**
   * Initialize the 3D viewer with a DOM container
   * Sets up renderer, scene, all components, and starts the render loop
   */
  init(domRef: HTMLDivElement): void;

  /**
   * Add an event handler to the viewer (with IoC initialization)
   */
  addEventHandler(handler: Viewer3DEventHandler): void;

  /**
   * Remove an event handler from the viewer
   */
  removeEventHandler(handler: Viewer3DEventHandler): void;

  /**
   * Complete cleanup - dispose all resources and stop render loop
   */
  dispose(): void;
}
