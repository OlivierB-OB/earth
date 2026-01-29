import L from "leaflet";
import { FlatMapLayer } from "./FlatMapLayer";

/**
 * MarkerLayer - Example FlatMapLayer implementation
 * Manages a marker on the map with customizable position and styling
 */
export class FlatMapMarkerLayer extends FlatMapLayer {
  private latitude: number;
  private longitude: number;
  private marker: L.CircleMarker | null = null;
  private markerOptions: L.CircleMarkerOptions;

  constructor(
    name: string = "MarkerLayer",
    latitude: number = 0,
    longitude: number = 0,
    options: L.CircleMarkerOptions = {}
  ) {
    super(name);
    this.latitude = latitude;
    this.longitude = longitude;
    this.markerOptions = {
      radius: 8,
      fillColor: "#ff0000",
      color: "#ff0000",
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.6,
      ...options,
    };
  }

  /**
   * Render the marker on the map
   */
  render(): void {
    super.render(); // Call parent to ensure initialization check

    if (this.marker) {
      this.marker.remove();
    }

    if (this.flatMap === null) {
      throw new Error("FlatMap not initialized");
    }

    this.marker = L.circleMarker(
      [this.latitude, this.longitude],
      this.markerOptions
    ).addTo(this.flatMap.map!);
  }

  /**
   * Update marker position
   * @param latitude - New latitude
   * @param longitude - New longitude
   */
  setPosition(latitude: number, longitude: number): void {
    this.latitude = latitude;
    this.longitude = longitude;
    this.rerender();
  }

  /**
   * Update marker styling options
   * @param options - New marker options
   */
  setOptions(options: L.CircleMarkerOptions): void {
    this.markerOptions = { ...this.markerOptions, ...options };
    this.rerender();
  }

  /**
   * Clean up the marker
   */
  dispose(): void {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    super.dispose();
  }
}
