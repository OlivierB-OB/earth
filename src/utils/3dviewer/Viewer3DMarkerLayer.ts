import * as THREE from "three";
import { Viewer3DSceneBase } from "./Viewer3DSceneBase";
import { CoordinateConverter } from "./utils/CoordinateConverter";

/**
 * Concrete scene component that manages the focus marker (red sphere)
 */
export class Viewer3DMarkerLayer extends Viewer3DSceneBase<THREE.Mesh> {
  private latitude: number = 0;
  private longitude: number = 0;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.Material | null = null;
  private markerOptions: {
    radius: number;
    widthSegments: number;
    heightSegments: number;
    color: number;
  } = {
    radius: 0.05,
    widthSegments: 16,
    heightSegments: 16,
    color: 0xff0000,
  };

  protected renderScene(): THREE.Mesh {
    this.geometry = new THREE.SphereGeometry(
      this.markerOptions.radius,
      this.markerOptions.widthSegments,
      this.markerOptions.heightSegments
    );

    this.material = new THREE.MeshBasicMaterial({
      color: this.markerOptions.color,
    });

    const mesh = new THREE.Mesh(this.geometry, this.material);

    // Position at initial location
    const position = CoordinateConverter.latLngTo3DPosition(
      this.latitude,
      this.longitude,
      1.05
    );
    mesh.position.copy(position);

    return mesh;
  }

  /**
   * Update marker position from latitude/longitude
   */
  setPosition(latitude: number, longitude: number): void {
    this.latitude = latitude;
    this.longitude = longitude;

    if (this.object) {
      const position = CoordinateConverter.latLngTo3DPosition(latitude, longitude, 1.05);
      this.object.position.copy(position);
    }
  }

  /**
   * Update marker styling options
   */
  setOptions(options: Partial<typeof this.markerOptions>): void {
    this.markerOptions = { ...this.markerOptions, ...options };
    this.refresh();
  }

  /**
   * Clean up resources
   */
  override dispose(): void {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();

    super.dispose();
  }
}
