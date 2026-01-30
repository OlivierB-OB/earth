import type { WebGLRenderer } from "three";
import type { IViewer3DItem } from "./IViewer3DItem";

/**
 * Renderer component for 3D viewer
 * Manages WebGL renderer lifecycle, sizing, and DOM attachment
 * Extends Viewer3DItem to follow the composable component pattern
 */
export interface IViewer3DRenderer extends IViewer3DItem<WebGLRenderer> {
  /**
   * Handle window resize
   */
  handleResize(): void;
}
