import * as THREE from "three";
import { Viewer3DSceneBase } from "./Viewer3DSceneBase";

/**
 * Concrete scene component that wraps the THREE.Scene
 * Unlike other scene components, this doesn't get added to another scene
 */
export class Viewer3DScene extends Viewer3DSceneBase<THREE.Scene> {
  protected renderScene(): THREE.Scene {
    return new THREE.Scene();
  }

  /**
   * Override render to NOT add scene to itself
   */
  override render(): void {
    if (!this.viewer3D) {
      console.warn("Viewer3D not initialized. Call init() first.");
      return;
    }

    // Create scene without adding it to another scene
    this.object = this.renderScene();
    this.initialized = true;
  }

  /**
   * Get the wrapped scene
   */
  getScene(): THREE.Scene | null {
    return this.object;
  }
}
