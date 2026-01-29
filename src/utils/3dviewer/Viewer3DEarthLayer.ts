import * as THREE from "three";
import { Viewer3DSceneBase } from "./Viewer3DSceneBase";

/**
 * Concrete scene component that manages Earth sphere + lighting
 * Wraps as a THREE.Group containing the sphere mesh and lights
 */
export class Viewer3DEarthLayer extends Viewer3DSceneBase<THREE.Group> {
  private earthMesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.Material | null = null;
  private textureLoader: THREE.TextureLoader | null = null;

  protected renderScene(): THREE.Group {
    const group = new THREE.Group();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    group.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    group.add(directionalLight);

    // Earth sphere
    this.geometry = new THREE.SphereGeometry(1, 64, 64);

    // Load NASA Blue Marble Earth texture from CORS-enabled CDN
    this.textureLoader = new THREE.TextureLoader();
    const earthTexture = this.textureLoader.load(
      "https://cdn.jsdelivr.net/npm/three-globe@2.29.4/example/img/earth-day.jpg"
    );

    this.material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 5,
    });

    this.earthMesh = new THREE.Mesh(this.geometry, this.material);
    this.earthMesh.rotation.z = 0.3;
    group.add(this.earthMesh);

    return group;
  }

  /**
   * Set rotation of the Earth sphere
   */
  setRotation(x: number, y: number, z: number): void {
    if (this.earthMesh) {
      this.earthMesh.rotation.set(x, y, z);
    }
  }

  /**
   * Get current rotation of the Earth sphere
   */
  getRotation(): THREE.Euler {
    if (this.earthMesh) {
      return this.earthMesh.rotation.clone();
    }
    return new THREE.Euler(0, 0, 0.3);
  }

  /**
   * Get the Earth mesh for direct manipulation
   */
  getEarthMesh(): THREE.Mesh | null {
    return this.earthMesh;
  }

  /**
   * Clean up resources
   */
  override dispose(): void {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();

    super.dispose();

    this.earthMesh = null;
    this.textureLoader = null;
  }
}
