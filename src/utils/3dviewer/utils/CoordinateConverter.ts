import * as THREE from "three";

/**
 * Utility class for converting between different coordinate systems:
 * - 3D Cartesian coordinates (x, y, z)
 * - Geographic coordinates (latitude, longitude)
 * - Earth rotation angles (Euler angles)
 * - 2D screen/mouse coordinates
 */
export class CoordinateConverter {
  /**
   * Convert Earth's 3D rotation (Euler angles) to geographic coordinates
   * Calculates which lat/lon is at the center of the screen
   */
  static earthRotationToLatLng(rotationX: number, rotationY: number): [number, number] {
    // The center of the screen points to the center of the Earth's visible face
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(-rotationX, -rotationY, 0)
    );

    // Vector pointing from Earth center outward (initially forward)
    const centerVector = new THREE.Vector3(0, 0, 1);
    centerVector.applyMatrix4(rotationMatrix);

    // Convert to lat/lon
    const latitude = Math.asin(centerVector.y) * (180 / Math.PI);
    const longitude = Math.atan2(centerVector.x, centerVector.z) * (180 / Math.PI);

    return [latitude, longitude];
  }

  /**
   * Convert geographic coordinates to Earth rotation angles
   * Calculates the rotation needed to center a location on screen
   */
  static latLngToEarthRotation(latitude: number, longitude: number): THREE.Euler {
    const lat = latitude * (Math.PI / 180);
    const lon = longitude * (Math.PI / 180);

    // Calculate target rotation to center this location on the front of the sphere
    const rotationX = -lat;
    const rotationY = -lon;

    return new THREE.Euler(rotationX, rotationY, 0);
  }

  /**
   * Convert geographic coordinates to 3D Cartesian position on sphere surface
   */
  static latLngTo3DPosition(latitude: number, longitude: number, radius: number = 1.0): THREE.Vector3 {
    const lat = latitude * (Math.PI / 180);
    const lon = longitude * (Math.PI / 180);

    const x = radius * Math.cos(lat) * Math.sin(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.cos(lon);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Convert 3D position on sphere to geographic coordinates
   */
  static position3DToLatLng(position: THREE.Vector3): [number, number] {
    const normalized = position.clone().normalize();

    const latitude = Math.asin(normalized.y) * (180 / Math.PI);
    const longitude = Math.atan2(normalized.x, normalized.z) * (180 / Math.PI);

    return [latitude, longitude];
  }

  /**
   * Convert mouse coordinates to normalized device coordinates (-1 to 1)
   */
  static mouseToNormalizedDeviceCoords(
    mouseX: number,
    mouseY: number,
    viewportWidth: number,
    viewportHeight: number
  ): THREE.Vector2 {
    const ndc = new THREE.Vector2();
    ndc.x = (mouseX / viewportWidth) * 2 - 1;
    ndc.y = -(mouseY / viewportHeight) * 2 + 1;
    return ndc;
  }
}
