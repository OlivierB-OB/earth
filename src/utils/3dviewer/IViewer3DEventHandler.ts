import type { IViewer3D } from "./IViewer3D";

export interface IViewer3DEventHandler {
  /**
   * Initialize the event handler with a reference to the Viewer3D instance (IoC)
   */
  init(viewer3D: IViewer3D): void;

  /**
   * Attach the event listener to its target
   */
  attach(): void;

  /**
   * Detach the event listener from its target
   */
  detach(): void;

  /**
   * Complete cleanup
   */
  dispose(): void;
}
