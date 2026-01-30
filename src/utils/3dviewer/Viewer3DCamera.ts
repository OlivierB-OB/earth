import { PerspectiveCamera } from "three";
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

    // Increase far plane to see terrain that spans 100+ km in each direction
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000000);

    // Position camera above and looking down at terrain
    // Drone is at (0, elevation, 0), camera looks down at terrain around it
    camera.position.set(0, 5000, 10000); // 5km up, 10km back

    // Look at a point on the ground near the drone
    camera.lookAt(0, 0, 0);

    return camera;
  }

  /**
   * Update camera zoom by adjusting FOV (for drone view, zoom changes FOV)
   * Clamped to [30, 120] degrees
   */
  setZoom(fov: number): void {
    if (this.initialized) {
      this.object.fov = Math.max(30, Math.min(120, fov));
      this.object.updateProjectionMatrix();
    }
  }

  /**
   * Update camera zoom by adjusting FOV from delta
   * Clamped to [30, 120] degrees
   */
  updateZoom(delta: number): void {
    this.setZoom(this.object.fov + delta * 10); // Scale delta for FOV adjustment
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
   * Update camera tilt (pitch angle) for looking up/down
   */
  setPitch(degrees: number): void {
    if (this.initialized) {
      const clampedDegrees = Math.max(-45, Math.min(45, degrees)); // Limit to ±45 degrees
      const radians = (clampedDegrees * Math.PI) / 180;
      // Adjust look target based on pitch
      const distance = 100;
      const lookAtY = -Math.sin(radians) * distance;
      const lookAtZ = Math.cos(radians) * distance;
      this.object.lookAt(0, 1.5 + lookAtY, lookAtZ);
    }
  }
}
