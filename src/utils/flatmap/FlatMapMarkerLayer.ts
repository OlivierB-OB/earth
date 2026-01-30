import L from "leaflet";
import { FlatMapLayer } from "./FlatMapLayer";

/**
 * FlatMapMarkerLayer - FlatMapLayer implementation for focus marker
 * Manages a circle marker on the map with customizable position and styling
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
}
