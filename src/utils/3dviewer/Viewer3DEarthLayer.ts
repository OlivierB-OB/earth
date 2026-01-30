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
import { CONFIG } from "../../config";
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
    const ambientLight = new AmbientLight(
      CONFIG.LIGHTING.AMBIENT_COLOR,
      CONFIG.LIGHTING.AMBIENT_INTENSITY
    );
    group.add(ambientLight);

    const directionalLight = new DirectionalLight(
      CONFIG.LIGHTING.DIRECTIONAL_COLOR,
      CONFIG.LIGHTING.DIRECTIONAL_INTENSITY
    );
    directionalLight.position.set(
      CONFIG.LIGHTING.DIRECTIONAL_POSITION_X,
      CONFIG.LIGHTING.DIRECTIONAL_POSITION_Y,
      CONFIG.LIGHTING.DIRECTIONAL_POSITION_Z
    );
    group.add(directionalLight);

    // Earth sphere
    this.geometry = new SphereGeometry(
      1,
      CONFIG.EARTH.GEOMETRY_WIDTH_SEGMENTS,
      CONFIG.EARTH.GEOMETRY_HEIGHT_SEGMENTS
    );

    // Load NASA Blue Marble Earth texture from CORS-enabled CDN
    this.textureLoader = new TextureLoader();
    const earthTexture = this.textureLoader.load(
      "https://cdn.jsdelivr.net/npm/three-globe@2.29.4/example/img/earth-day.jpg"
    );

    this.material = new MeshPhongMaterial({
      map: earthTexture,
      shininess: CONFIG.EARTH.MATERIAL_SHININESS,
    });

    this.earthMesh = new Mesh(this.geometry, this.material);
    this.earthMesh.rotation.z = CONFIG.EARTH.AXIAL_TILT_Z;
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
    return new Euler(0, 0, CONFIG.EARTH.AXIAL_TILT_Z);
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
