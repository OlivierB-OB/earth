import { SphereGeometry, MeshBasicMaterial, Mesh } from "three";
import { Viewer3DSceneItem } from "./Viewer3DSceneItem";
import { CoordinateConverter } from "./utils/CoordinateConverter";

/**
 * Concrete scene component that manages the focus marker (red sphere)
 */
export class Viewer3DMarkerLayer extends Viewer3DSceneItem<Mesh> {
  private latitude: number = 0;
  private longitude: number = 0;
  private geometry: SphereGeometry | null = null;
  private material: MeshBasicMaterial | null = null;
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

  protected makeObject(): Mesh {
    this.geometry = new SphereGeometry(
      this.markerOptions.radius,
      this.markerOptions.widthSegments,
      this.markerOptions.heightSegments
    );

    this.material = new MeshBasicMaterial({
      color: this.markerOptions.color,
    });

    const mesh = new Mesh(this.geometry, this.material);

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

    if (this.initialized) {
      const position = CoordinateConverter.latLngTo3DPosition(
        latitude,
        longitude,
        1.05
      );
      this.object.position.copy(position);
    }
  }

  /**
   * Update marker styling options
   */
  setOptions(options: Partial<typeof this.markerOptions>): void {
    this.markerOptions = { ...this.markerOptions, ...options };
    this.render();
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
