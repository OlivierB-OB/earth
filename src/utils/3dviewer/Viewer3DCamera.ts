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
   * Update camera position to follow drone with fixed offset
   * @param droneWorldX - Drone X position in world coordinates
   * @param droneWorldZ - Drone Z position in world coordinates
   * @param droneElevation - Drone altitude (Y coordinate)
   */
  updatePositionForDrone(
    droneWorldX: number,
    droneWorldZ: number,
    droneElevation: number
  ): void {
    if (this.initialized) {
      // Camera offset: maintain a fixed distance above and behind the drone
      const cameraOffsetY = CONFIG.CAMERA.DRONE_CAMERA_OFFSET_Y;
      const cameraOffsetZ = CONFIG.CAMERA.DRONE_CAMERA_OFFSET_Z;

      // Update camera position to follow drone with offset
      this.object.position.set(
        droneWorldX,
        droneElevation + cameraOffsetY,
        droneWorldZ + cameraOffsetZ
      );

      // Look at a point on the ground near the drone
      this.object.lookAt(droneWorldX, droneElevation, droneWorldZ);
    }
  }
}
