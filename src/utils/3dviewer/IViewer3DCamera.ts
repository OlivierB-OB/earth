import type { PerspectiveCamera } from "three";
import type { IViewer3DItem } from "./IViewer3DItem";

/**
 * Interface for 3D camera component
 * Defines the contract for managing Three.js perspective camera
 */
export interface IViewer3DCamera extends IViewer3DItem<PerspectiveCamera> {
  /**
   * Update camera zoom by adjusting z position
   * Clamped to [1.5, 5] range
   */
  setZoom(distance: number): void;

  /**
   * Update aspect ratio for window resize
   */
  updateAspectRatio(width: number, height: number): void;
}
