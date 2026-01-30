import {
  Mesh,
  SphereGeometry,
  MeshPhongMaterial,
  TextureLoader,
  Group,
  AmbientLight,
  DirectionalLight,
  Euler,
} from "three";
import { Viewer3DSceneItem } from "./Viewer3DSceneItem";

/**
 * Concrete scene component that manages Earth sphere + lighting
 * Wraps as a THREE.Group containing the sphere mesh and lights
 */
export class Viewer3DEarthLayer extends Viewer3DSceneItem<Group> {
  private earthMesh: Mesh | null = null;
  private geometry: SphereGeometry | null = null;
  private material: MeshPhongMaterial | null = null;
  private textureLoader: TextureLoader | null = null;

  protected makeObject(): Group {
    const group = new Group();

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    group.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    group.add(directionalLight);

    // Earth sphere
    this.geometry = new SphereGeometry(1, 64, 64);

    // Load NASA Blue Marble Earth texture from CORS-enabled CDN
    this.textureLoader = new TextureLoader();
    const earthTexture = this.textureLoader.load(
      "https://cdn.jsdelivr.net/npm/three-globe@2.29.4/example/img/earth-day.jpg"
    );

    this.material = new MeshPhongMaterial({
      map: earthTexture,
      shininess: 5,
    });

    this.earthMesh = new Mesh(this.geometry, this.material);
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
  getRotation(): Euler {
    if (this.earthMesh) {
      return this.earthMesh.rotation.clone();
    }
    return new Euler(0, 0, 0.3);
  }

  /**
   * Get the Earth mesh for direct manipulation
   */
  getEarthMesh(): Mesh | null {
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
    this.geometry = null;
    this.material = null;
    this.textureLoader = null;
  }
}
