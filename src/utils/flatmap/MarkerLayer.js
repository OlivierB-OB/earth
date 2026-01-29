import L from "leaflet";
import { FlatMapLayer } from "./FlatMapLayer";

/**
 * MarkerLayer - Example FlatMapLayer implementation
 * Manages a marker on the map with customizable position and styling
 */
export class FlatMapMarkerLayer extends FlatMapLayer {
  constructor(name = "MarkerLayer", latitude = 0, longitude = 0, options = {}) {
    super(name);
    this.latitude = latitude;
    this.longitude = longitude;
    this.marker = null;
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
  render() {
    super.render(); // Call parent to ensure initialization check

    if (this.marker) {
      this.marker.remove();
    }

    this.marker = L.circleMarker(
      [this.latitude, this.longitude],
      this.markerOptions,
    ).addTo(this.flatMap.map);
  }

  /**
   * Update marker position
   * @param {number} latitude - New latitude
   * @param {number} longitude - New longitude
   */
  setPosition(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.rerender();
  }

  /**
   * Update marker styling options
   * @param {Object} options - New marker options
   */
  setOptions(options) {
    this.markerOptions = { ...this.markerOptions, ...options };
    this.rerender();
  }

  /**
   * Clean up the marker
   */
  dispose() {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    super.dispose();
  }
}
