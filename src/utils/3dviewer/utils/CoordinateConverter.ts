import { Matrix4, Euler, Vector2, Vector3 } from "three";

/**
 * Utility class for converting between different coordinate systems:
 * - 3D Cartesian coordinates (x, y, z)
 * - Geographic coordinates (latitude, longitude)
 * - Earth rotation angles (Euler angles)
 * - 2D screen/mouse coordinates
 */
export class CoordinateConverter {
  /**
   * Convert Earth's 3D rotation (Euler angles) to geographic coordinates.
   * Calculates which latitude/longitude location is at the center of the screen.
   *
   * Algorithm:
   * 1. Create a rotation matrix from the Euler angles (negated since we rotate the camera inversely)
   * 2. Start with a forward-facing vector (0, 0, 1) representing screen center
   * 3. Apply the rotation matrix to this vector to get the world-space direction
   * 4. Convert the resulting 3D vector to spherical coordinates:
   *    - Latitude: arcsin of Y component (vertical position on sphere)
   *    - Longitude: atan2 of X/Z components (horizontal position on sphere)
   * 5. Convert radians to degrees
   *
   * @param rotationX - Euler rotation around X axis (pitch)
   * @param rotationY - Euler rotation around Y axis (yaw)
   * @returns [latitude, longitude] in degrees
   */
  static earthRotationToLatLng(
    rotationX: number,
    rotationY: number
  ): [number, number] {
    // The center of the screen points to the center of the Earth's visible face
    const rotationMatrix = new Matrix4().makeRotationFromEuler(
      new Euler(-rotationX, -rotationY, 0)
    );

    // Vector pointing from Earth center outward (initially forward)
    const centerVector = new Vector3(0, 0, 1);
    centerVector.applyMatrix4(rotationMatrix);

    // Convert to lat/lon using inverse spherical coordinates
    const latitude = Math.asin(centerVector.y) * (180 / Math.PI);
    const longitude =
      Math.atan2(centerVector.x, centerVector.z) * (180 / Math.PI);

    return [latitude, longitude];
  }

  /**
   * Convert geographic coordinates to Earth rotation angles.
   * Calculates the Euler angles needed to rotate the Earth so that a location
   * is centered on the screen.
   *
   * Algorithm:
   * 1. Convert latitude/longitude from degrees to radians
   * 2. The target rotations are simply the negative of the input angles:
   *    - rotationX = -latitude (negative pitch)
   *    - rotationY = -longitude (negative yaw)
   * This achieves the inverse of the forward transformation, centering the
   * specified location in view.
   *
   * @param latitude - Target latitude in degrees [-90, 90]
   * @param longitude - Target longitude in degrees [-180, 180]
   * @returns Euler angles with Z=0 (no roll)
   */
  static latLngToEarthRotation(latitude: number, longitude: number): Euler {
    const lat = latitude * (Math.PI / 180);
    const lon = longitude * (Math.PI / 180);

    // Calculate target rotation to center this location on the front of the sphere
    const rotationX = -lat;
    const rotationY = -lon;

    return new Euler(rotationX, rotationY, 0);
  }

  /**
   * Convert geographic coordinates to 3D Cartesian position on sphere surface.
   * Uses standard spherical coordinate conversion formulas.
   *
   * Algorithm (spherical to Cartesian):
   * - x = radius × cos(lat) × sin(lon)
   * - y = radius × sin(lat)
   * - z = radius × cos(lat) × cos(lon)
   *
   * @param latitude - Latitude in degrees [-90, 90]
   * @param longitude - Longitude in degrees [-180, 180]
   * @param radius - Sphere radius (default 1.0)
   * @returns 3D vector on sphere surface
   */
  static latLngTo3DPosition(
    latitude: number,
    longitude: number,
    radius: number = 1.0
  ): Vector3 {
    const lat = latitude * (Math.PI / 180);
    const lon = longitude * (Math.PI / 180);

    const x = radius * Math.cos(lat) * Math.sin(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.cos(lon);

    return new Vector3(x, y, z);
  }

  /**
   * Convert 3D position on sphere to geographic coordinates.
   * Inverse of latLngTo3DPosition, using inverse spherical coordinate formulas.
   *
   * Algorithm (Cartesian to spherical):
   * - Normalize the 3D vector
   * - Latitude = arcsin(y) - vertical component determines latitude
   * - Longitude = atan2(x, z) - horizontal components determine longitude
   * - Convert radians to degrees
   *
   * @param position - 3D vector on sphere surface
   * @returns [latitude, longitude] in degrees
   */
  static position3DToLatLng(position: Vector3): [number, number] {
    const normalized = position.clone().normalize();

    const latitude = Math.asin(normalized.y) * (180 / Math.PI);
    const longitude = Math.atan2(normalized.x, normalized.z) * (180 / Math.PI);

    return [latitude, longitude];
  }

  /**
   * Convert mouse coordinates to normalized device coordinates (-1 to 1).
   * Converts screen-space coordinates to the [-1, 1] range used by Three.js raycasting.
   *
   * Algorithm:
   * - X: (mouseX / width) × 2 - 1, maps [0, width] to [-1, 1]
   * - Y: -(mouseY / height) × 2 + 1, maps [0, height] to [1, -1] (inverted for screen coords)
   *
   * @param mouseX - Mouse X position in pixels
   * @param mouseY - Mouse Y position in pixels
   * @param viewportWidth - Canvas/viewport width
   * @param viewportHeight - Canvas/viewport height
   * @returns Normalized device coordinates for raycasting
   */
  static mouseToNormalizedDeviceCoords(
    mouseX: number,
    mouseY: number,
    viewportWidth: number,
    viewportHeight: number
  ): Vector2 {
    const ndc = new Vector2();
    ndc.x = (mouseX / viewportWidth) * 2 - 1;
    ndc.y = -(mouseY / viewportHeight) * 2 + 1;
    return ndc;
  }
}
