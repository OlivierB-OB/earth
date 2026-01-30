import { PerspectiveCamera } from "three";
import { Viewer3DItem } from "./Viewer3DItem";
import type { IViewer3DCamera } from "./IViewer3DCamera";

/**
 * Concrete scene component that wraps THREE.PerspectiveCamera
 */
export class Viewer3DCamera
  extends Viewer3DItem<PerspectiveCamera>
  implements IViewer3DCamera
{
  protected makeObject(): PerspectiveCamera {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.z = 2.5;

    return camera;
  }

  /**
   * Update camera zoom by adjusting z position
   * Clamped to [1.5, 5] range
   */
  setZoom(distance: number): void {
    if (this.initialized) {
      this.object.position.z = Math.max(1.5, Math.min(5, distance));
    }
  }

  /**
   * Update camera zoom by adjusting z position from a provide delta to this existing position
   * Clamped to [1.5, 5] range
   */
  updateZoom(delta: number): void {
    this.setZoom(this.object.position.z + delta);
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
}
