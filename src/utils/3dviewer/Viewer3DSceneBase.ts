import * as THREE from "three";
import type { IViewer3D } from "./IViewer3D";

/**
 * Abstract base class for composable 3D scene components
 * Extends FlatMapLayer pattern to Three.js world
 *
 * Each scene component wraps a specific THREE.Object3D and manages its lifecycle
 */
export abstract class Viewer3DSceneBase<T extends THREE.Object3D> {
  protected viewer3D: IViewer3D | null = null;
  protected object: T | null = null;
  protected initialized: boolean = false;

  /**
   * Receive the Viewer3D instance (IoC injection)
   */
  init(viewer3D: IViewer3D): void {
    this.viewer3D = viewer3D;
  }

  /**
   * Subclasses must implement this to define what object to create
   */
  protected abstract renderScene(): T;

  /**
   * Create and add the object to the scene
   */
  render(): void {
    if (!this.viewer3D) {
      console.warn("Viewer3D not initialized. Call init() first.");
      return;
    }

    // Remove old object if it exists
    if (this.object) {
      const scene = this.viewer3D.getScene();
      if (scene && scene.children.includes(this.object)) {
        scene.remove(this.object);
      }
    }

    // Create new object
    this.object = this.renderScene();

    // Add to scene (unless this is the scene itself)
    if (!(this.object instanceof THREE.Scene)) {
      const scene = this.viewer3D.getScene();
      if (scene) {
        scene.add(this.object);
      }
    }

    this.initialized = true;
  }

  /**
   * Safe re-render only if viewer is initialized
   */
  refresh(): void {
    if (this.viewer3D && this.initialized) {
      this.render();
    }
  }

  /**
   * Clean up resources (geometries, materials, textures, etc.)
   */
  dispose(): void {
    if (this.object) {
      // Recursively dispose all children
      this.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });

      // Remove from scene
      const scene = this.viewer3D?.getScene();
      if (scene && this.object.parent === scene) {
        scene.remove(this.object);
      }
    }

    this.viewer3D = null;
    this.object = null;
    this.initialized = false;
  }

  /**
   * Get the wrapped THREE object
   */
  getObject(): T | null {
    return this.object;
  }
}
