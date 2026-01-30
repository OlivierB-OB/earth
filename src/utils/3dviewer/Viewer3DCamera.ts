import { PerspectiveCamera } from "three";
import { CONFIG } from "../../config";
import { Viewer3DItem } from "./Viewer3DItem";
import type { IViewer3DCamera } from "./IViewer3DCamera";

/**
 * Concrete scene component that wraps THREE.PerspectiveCamera
 * For drone simulator: camera is positioned at drone cockpit (0, 0, 0)
 * looking forward with a downward tilt to simulate pilot's view
 */
export class Viewer3DCamera
  extends Viewer3DItem<PerspectiveCamera>
  implements IViewer3DCamera
{
  protected makeObject(): PerspectiveCamera {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Increase far plane to see terrain that spans 100+ km (100,000+ meters) in each direction
    const camera = new PerspectiveCamera(
      CONFIG.CAMERA.FOV,
      width / height,
      CONFIG.CAMERA.NEAR_PLANE,
      CONFIG.CAMERA.FAR_PLANE
    );

    // Position camera above and looking down at terrain
    // Drone is at (0, elevation, 0), camera looks down at terrain around it
    camera.position.set(
      0,
      CONFIG.CAMERA.DEFAULT_POSITION_Y,
      CONFIG.CAMERA.DEFAULT_POSITION_Z
    );

    // Look at a point on the ground near the drone
    camera.lookAt(0, 0, 0);

    return camera;
  }

  /**
   * Update camera zoom by adjusting FOV (for drone view, zoom changes FOV)
   * Clamped to [FOV_MIN, FOV_MAX] degrees
   */
  setZoom(fov: number): void {
    if (this.initialized) {
      this.object.fov = Math.max(
        CONFIG.CAMERA.FOV_MIN,
        Math.min(CONFIG.CAMERA.FOV_MAX, fov)
      );
      this.object.updateProjectionMatrix();
    }
  }

  /**
   * Update camera zoom by adjusting FOV from delta
   * Clamped to [FOV_MIN, FOV_MAX] degrees
   */
  updateZoom(delta: number): void {
    this.setZoom(this.object.fov + delta * CONFIG.CAMERA.ZOOM_DELTA_SCALE);
  }

  /**
   * Update aspect ratio for window resize
   */
  updateAspectRatio(width: number, height: number): void {
    if (this.initialized) {
      this.object.aspect = width / height;
      this.object.updateProjectionMatrix();
    }
  }

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
  ): void {
    if (this.initialized) {
      // Camera offset: 2m behind drone, 1m above
      const cameraOffsetY = CONFIG.CAMERA.DRONE_CAMERA_OFFSET_Y; // 1m
      const cameraOffsetZ = CONFIG.CAMERA.DRONE_CAMERA_OFFSET_Z; // 2m

      // Convert heading to radians (0° = North, 90° = East)
      const headingRad = (droneHeading * Math.PI) / 180;

      // Rotate the 2m offset around Y-axis based on drone heading
      // The offset needs to rotate so camera stays behind the drone's heading direction
      const offsetX = -cameraOffsetZ * Math.sin(headingRad);
      const offsetZ = cameraOffsetZ * Math.cos(headingRad);

      // Update camera position to follow drone with heading-relative offset
      this.object.position.set(
        droneWorldX + offsetX,
        droneElevation + cameraOffsetY,
        droneWorldZ + offsetZ
      );

      // Look at the drone's position
      this.object.lookAt(droneWorldX, droneElevation, droneWorldZ);
    }
  }
}
