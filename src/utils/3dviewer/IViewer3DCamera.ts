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
   * Update camera zoom by adjusting z position from a provide delta to this existing position
   * Clamped to [1.5, 5] range
   */
  updateZoom(delta: number): void;

  /**
   * Update aspect ratio for window resize
   */
  updateAspectRatio(width: number, height: number): void;

  /**
   * Update camera position to follow drone with heading-relative offset
   * Camera stays 2m behind drone's heading direction and 1m above
   * @param droneWorldX - Drone X position in world coordinates
   * @param droneWorldZ - Drone Z position in world coordinates
   * @param droneElevation - Drone altitude (Y coordinate)
   * @param droneHeading - Drone heading in degrees (0-360), where 0° = North
   */
  updatePositionForDrone(
    droneWorldX: number,
    droneWorldZ: number,
    droneElevation: number,
    droneHeading: number
  ): void;
}
