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

    // Position camera above and to the side looking down at terrain
    // Use an isometric-like view: diagonal position from terrain with downward angle
    // This gives a better bird's-eye overview of the terrain and objects
    camera.position.set(
      CONFIG.CAMERA.DEFAULT_POSITION_Z, // X offset (same distance as Z)
      CONFIG.CAMERA.DEFAULT_POSITION_Y,
      CONFIG.CAMERA.DEFAULT_POSITION_Z // Z offset (looking back toward origin)
    );

    // Look at a point in the middle of the terrain, slightly above ground level
    // This focuses the view on the terrain surface with the buildings/trees
    camera.lookAt(0, 50, 0);

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
   * Camera always looks in same direction as drone, pitched down 30°
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

      // Rotate the offset around Y-axis based on drone heading
      // The offset needs to rotate so camera stays behind the drone's heading direction
      const offsetX = -cameraOffsetZ * Math.sin(headingRad);
      const offsetZ = cameraOffsetZ * Math.cos(headingRad);

      // Update camera position to follow drone with heading-relative offset
      this.object.position.set(
        droneWorldX + offsetX,
        droneElevation + cameraOffsetY,
        droneWorldZ + offsetZ
      );

      // Look at drone position and add 30° downward pitch
      this.object.lookAt(droneWorldX, droneElevation, droneWorldZ);

      // Apply 30° pitch (downward tilt) in camera's local space
      // This rotates around the camera's local X-axis to look down at the ground
      this.object.rotateX(-Math.PI / 6); // -π/6 radians = -30°
    }
  }
}
