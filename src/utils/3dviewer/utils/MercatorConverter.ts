import { toMercator, toWgs84 } from "@turf/projection";
import { point } from "@turf/helpers";

/**
 * MercatorConverter provides Web Mercator projection utilities for accurate
 * geographic-to-planar coordinate conversions, especially at higher latitudes.
 *
 * This replaces the simplified 111,000 meters/degree approximation which only
 * works well near the equator.
 */
export class MercatorConverter {
  /**
   * Convert latitude/longitude to Mercator projected coordinates (meters).
   *
   * @param latitude Latitude in degrees [-90, 90]
   * @param longitude Longitude in degrees [-180, 180]
   * @returns [x, y] in meters using Web Mercator projection
   */
  static latLngToMeters(latitude: number, longitude: number): [number, number] {
    // Create a GeoJSON point to pass to Turf
    const geoPoint = point([longitude, latitude]);

    // Convert to Mercator projection
    const projected = toMercator(geoPoint);
    const coords = projected.geometry.coordinates;

    // Turf returns [lng, lat] in Mercator space, we return [x, y]
    return [coords[0], coords[1]];
  }

  /**
   * Convert Mercator projected coordinates (meters) back to latitude/longitude.
   *
   * @param x Mercator X coordinate in meters
   * @param y Mercator Y coordinate in meters
   * @returns [latitude, longitude] in degrees
   */
  static metersToLatLng(x: number, y: number): [number, number] {
    // Create a Mercator-projected GeoJSON point
    const mercPoint = point([x, y]);

    // Convert back from Mercator to geographic
    const geographic = toWgs84(mercPoint);
    const coords = geographic.geometry.coordinates;

    // Turf returns [lng, lat], we return [lat, lng]
    return [coords[1], coords[0]];
  }

  /**
   * Calculate distance between two geographic coordinates in meters.
   * Uses Mercator projection for accuracy at various latitudes.
   *
   * @param lat1 First latitude in degrees
   * @param lng1 First longitude in degrees
   * @param lat2 Second latitude in degrees
   * @param lng2 Second longitude in degrees
   * @returns Distance in meters
   */
  static distanceInMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const [x1, y1] = this.latLngToMeters(lat1, lng1);
    const [x2, y2] = this.latLngToMeters(lat2, lng2);

    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get the scale factor (meters per degree) at a given latitude.
   * Useful for converting between meters and degrees at a specific location.
   *
   * @param latitude Latitude in degrees
   * @returns Approximate meters per degree at this latitude
   */
  static metersPerDegreeAtLatitude(latitude: number): number {
    // Use two points 1 degree apart to calculate the scale
    const [x1] = this.latLngToMeters(latitude, 0);
    const [x2] = this.latLngToMeters(latitude, 1);

    const dx = x2 - x1;
    return Math.abs(dx);
  }
}
