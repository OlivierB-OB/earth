import * as THREE from "three";
import { Viewer3DSceneBase } from "./Viewer3DSceneBase";

/**
 * Concrete scene component that wraps THREE.PerspectiveCamera
 */
export class Viewer3DCameraComponent extends Viewer3DSceneBase<THREE.Camera> {
  private perspectiveCamera: THREE.PerspectiveCamera | null = null;

  protected renderScene(): THREE.Camera {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.perspectiveCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    this.perspectiveCamera.position.z = 2.5;

    return this.perspectiveCamera;
  }

  /**
   * Update camera zoom by adjusting z position
   * Clamped to [1.5, 5] range
   */
  setZoom(distance: number): void {
    if (this.perspectiveCamera) {
      this.perspectiveCamera.position.z = Math.max(1.5, Math.min(5, distance));
    }
  }

  /**
   * Update aspect ratio for window resize
   */
  updateAspectRatio(width: number, height: number): void {
    if (this.perspectiveCamera) {
      this.perspectiveCamera.aspect = width / height;
      this.perspectiveCamera.updateProjectionMatrix();
    }
  }

  /**
   * Get the camera instance
   */
  getCamera(): THREE.PerspectiveCamera | null {
    return this.perspectiveCamera;
  }
}
