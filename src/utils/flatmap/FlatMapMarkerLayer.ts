import L from "leaflet";
import { FlatMapLayer } from "./FlatMapLayer";

/**
 * MarkerLayer - Example FlatMapLayer implementation
 * Manages a marker on the map with customizable position and styling
 */
export class FlatMapMarkerLayer extends FlatMapLayer<L.CircleMarker> {
  private latitude: number;
  private longitude: number;
  private markerOptions: L.CircleMarkerOptions;

  constructor(
    latitude: number = 0,
    longitude: number = 0,
    options: L.CircleMarkerOptions = {}
  ) {
    super();
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
   * Render the marker
   */
  protected renderLayer(): L.CircleMarker {
    return L.circleMarker([this.latitude, this.longitude], this.markerOptions);
  }

  /**
   * Update marker position
   * @param latitude - New latitude
   * @param longitude - New longitude
   */
  setPosition(latitude: number, longitude: number): void {
    this.latitude = latitude;
    this.longitude = longitude;
    this.refresh();
  }

  /**
   * Update marker styling options
   * @param options - New marker options
   */
  setOptions(options: L.CircleMarkerOptions): void {
    this.markerOptions = { ...this.markerOptions, ...options };
    this.refresh();
  }
}
