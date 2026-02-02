import { Vector3 } from "three";
import { DroneState } from "../../types/Drone";

export interface CameraState {
  position: Vector3;
  fov: number;
}

export interface ChangeDetectionResult {
  positionChanged: boolean;
  headingChanged: boolean;
  cameraChanged: boolean;
}

/**
 * Tracks drone and camera state to detect meaningful changes.
 * Uses floating-point tolerance to avoid false positives from
 * floating-point arithmetic.
 */
export class ChangeTracker {
  private previousDroneState: DroneState | null = null;
  private previousCameraState: CameraState | null = null;

  // Tolerance for position changes (degrees)
  // 0.0001 degrees ≈ 0.01 meters at Earth scale
  private readonly POSITION_TOLERANCE = 0.0001;

  // Tolerance for heading changes (degrees)
  private readonly HEADING_TOLERANCE = 0.01;

  // Tolerance for camera FOV changes (degrees)
  private readonly FOV_TOLERANCE = 0.1;

  // Tolerance for camera position changes (meters)
  private readonly CAMERA_POSITION_TOLERANCE = 0.01;

  /**
   * Detects if drone position, heading, or camera state has changed
   * beyond configured tolerances.
   */
  public detectChanges(
    droneState: DroneState,
    cameraState: CameraState
  ): ChangeDetectionResult {
    const positionChanged = this.hasPositionChanged(droneState);
    const headingChanged = this.hasHeadingChanged(droneState);
    const cameraChanged = this.hasCameraChanged(cameraState);

    // Update tracking state
    this.previousDroneState = {
      ...droneState,
    };
    this.previousCameraState = {
      position: cameraState.position.clone(),
      fov: cameraState.fov,
    };

    return {
      positionChanged,
      headingChanged,
      cameraChanged,
    };
  }

  /**
   * Reset tracking state (called during initialization)
   */
  public reset(): void {
    this.previousDroneState = null;
    this.previousCameraState = null;
  }

  private hasPositionChanged(newState: DroneState): boolean {
    if (this.previousDroneState === null) {
      return true; // First detection always reports change
    }

    const latDiff = Math.abs(
      newState.latitude - this.previousDroneState.latitude
    );
    const lngDiff = Math.abs(
      newState.longitude - this.previousDroneState.longitude
    );
    const elevDiff = Math.abs(
      newState.elevation - this.previousDroneState.elevation
    );

    return (
      latDiff > this.POSITION_TOLERANCE ||
      lngDiff > this.POSITION_TOLERANCE ||
      elevDiff > this.POSITION_TOLERANCE
    );
  }

  private hasHeadingChanged(newState: DroneState): boolean {
    if (this.previousDroneState === null) {
      return true; // First detection always reports change
    }

    const newHeading = newState.heading ?? 0;
    const prevHeading = this.previousDroneState.heading ?? 0;

    // Normalize heading difference to account for wrap-around (359° → 0°)
    let diff = Math.abs(newHeading - prevHeading);
    if (diff > 180) {
      diff = 360 - diff;
    }

    return diff > this.HEADING_TOLERANCE;
  }

  private hasCameraChanged(newCamera: CameraState): boolean {
    if (this.previousCameraState === null) {
      return true; // First detection always reports change
    }

    // Check FOV (zoom) change
    const fovDiff = Math.abs(newCamera.fov - this.previousCameraState.fov);
    if (fovDiff > this.FOV_TOLERANCE) {
      return true;
    }

    // Check camera position change
    const positionDiff = newCamera.position.distanceTo(
      this.previousCameraState.position
    );
    if (positionDiff > this.CAMERA_POSITION_TOLERANCE) {
      return true;
    }

    return false;
  }

  /**
   * Debug helper to log current state
   */
  public toString(): string {
    const drone = this.previousDroneState
      ? `Drone(${this.previousDroneState.latitude.toFixed(4)}, ${this.previousDroneState.longitude.toFixed(4)}, ${this.previousDroneState.elevation.toFixed(1)}m, heading: ${(this.previousDroneState.heading ?? 0).toFixed(1)}°)`
      : "No state";

    const camera = this.previousCameraState
      ? `Camera(pos: (${this.previousCameraState.position.x.toFixed(2)}, ${this.previousCameraState.position.y.toFixed(2)}, ${this.previousCameraState.position.z.toFixed(2)}), fov: ${this.previousCameraState.fov.toFixed(1)}°)`
      : "No state";

    return `ChangeTracker { ${drone}, ${camera} }`;
  }
}
