import { CONFIG } from "../../config";
import { DroneState, DroneControls } from "../../types/Drone";
import { DataManager } from "../dataManager/DataManager";
import { MercatorConverter } from "../3dviewer/utils/MercatorConverter";

/**
 * Options for drone movement physics
 */
export interface DroneControllerOptions {
  maxHorizontalSpeed?: number; // m/s
  maxVerticalSpeed?: number; // m/s
  acceleration?: number; // m/s²
  horizontalDamping?: number; // [0, 1] for friction
  verticalDamping?: number; // [0, 1] for friction
  minElevation?: number; // meters
  maxElevation?: number; // meters
}

/**
 * Manages drone movement and physics
 */
export class DroneController {
  private options: Required<DroneControllerOptions>;
  private dataManager: DataManager;

  // Velocity state
  private velocityNorth: number = 0;
  private velocityEast: number = 0;
  private velocityVertical: number = 0;

  // Current drone state
  private droneState: DroneState;

  // Frame timing
  private lastUpdateTime: number = 0;
  private animationFrameId: number | null = null;

  constructor(
    initialState: DroneState,
    dataManager: DataManager,
    options: DroneControllerOptions = {}
  ) {
    this.droneState = { ...initialState };
    this.dataManager = dataManager;

    this.options = {
      maxHorizontalSpeed:
        options.maxHorizontalSpeed || CONFIG.DRONE.MAX_SPEED_HORIZONTAL,
      maxVerticalSpeed:
        options.maxVerticalSpeed || CONFIG.DRONE.MAX_SPEED_VERTICAL,
      acceleration: options.acceleration || CONFIG.DRONE.ACCELERATION,
      horizontalDamping:
        options.horizontalDamping || CONFIG.DRONE.HORIZONTAL_DAMPING,
      verticalDamping: options.verticalDamping || CONFIG.DRONE.VERTICAL_DAMPING,
      minElevation: options.minElevation || CONFIG.DRONE.MIN_ELEVATION,
      maxElevation: options.maxElevation || CONFIG.DRONE.MAX_ELEVATION,
    };
  }

  /**
   * Stop the drone controller
   */
  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Update drone state based on controls
   */
  public update(controls: DroneControls, deltaTime: number): DroneState {
    // Apply acceleration based on controls
    const acceleration = this.options.acceleration;

    // Horizontal movement (in degrees per second converted to m/s)
    // We treat lat/lng as a simplified 2D plane for movement
    if (controls.moveForward) {
      this.velocityNorth += acceleration * deltaTime;
    }
    if (controls.moveBack) {
      this.velocityNorth -= acceleration * deltaTime;
    }
    if (controls.moveRight) {
      this.velocityEast += acceleration * deltaTime;
    }
    if (controls.moveLeft) {
      this.velocityEast -= acceleration * deltaTime;
    }

    // Vertical movement
    if (controls.ascend) {
      this.velocityVertical += acceleration * deltaTime;
    }
    if (controls.descend) {
      this.velocityVertical -= acceleration * deltaTime;
    }

    // Apply damping (friction)
    this.velocityNorth *= this.options.horizontalDamping;
    this.velocityEast *= this.options.horizontalDamping;
    this.velocityVertical *= this.options.verticalDamping;

    // Clamp velocities
    this.velocityNorth = this.clamp(
      this.velocityNorth,
      -this.options.maxHorizontalSpeed,
      this.options.maxHorizontalSpeed
    );
    this.velocityEast = this.clamp(
      this.velocityEast,
      -this.options.maxHorizontalSpeed,
      this.options.maxHorizontalSpeed
    );
    this.velocityVertical = this.clamp(
      this.velocityVertical,
      -this.options.maxVerticalSpeed,
      this.options.maxVerticalSpeed
    );

    // Update position based on velocity
    // Use Mercator projection to convert m/s to degrees with latitude awareness
    const metersPerDegreeAtLat = MercatorConverter.metersPerDegreeAtLatitude(
      this.droneState.latitude
    );
    const metersToDegrees = 1 / metersPerDegreeAtLat;

    // Note: Longitude scale factor is constant in this approach,
    // but we use the same conversion for consistency with terrain/context layers
    const newLatitude =
      this.droneState.latitude +
      this.velocityNorth * deltaTime * metersToDegrees;
    const newLongitude =
      this.droneState.longitude +
      this.velocityEast * deltaTime * metersToDegrees;
    const newElevation =
      this.droneState.elevation + this.velocityVertical * deltaTime;

    // Update drone state
    this.droneState.latitude = this.clamp(
      newLatitude,
      CONFIG.DRONE.LATITUDE_MIN,
      CONFIG.DRONE.LATITUDE_MAX
    );
    this.droneState.longitude = this.normalizeLogitude(newLongitude);
    this.droneState.elevation = this.clamp(
      newElevation,
      this.options.minElevation,
      this.options.maxElevation
    );

    // Update heading based on movement direction
    if (
      Math.abs(this.velocityNorth) > CONFIG.DRONE.VELOCITY_THRESHOLD ||
      Math.abs(this.velocityEast) > CONFIG.DRONE.VELOCITY_THRESHOLD
    ) {
      this.droneState.heading =
        Math.atan2(this.velocityEast, this.velocityNorth) *
        (CONFIG.DRONE.DEGREES_TO_RADIANS_180 / Math.PI);
      if (this.droneState.heading < 0) {
        this.droneState.heading += CONFIG.DRONE.HEADING_NORMALIZE_360;
      }
    }

    // Update data manager with new position
    this.dataManager.updateDronePosition(
      this.droneState.latitude,
      this.droneState.longitude
    );

    return { ...this.droneState };
  }

  /**
   * Get current drone state
   */
  public getDroneState(): DroneState {
    return { ...this.droneState };
  }

  /**
   * Set drone state (for map clicks or other external updates)
   */
  public setDroneState(state: Partial<DroneState>): void {
    if (state.latitude !== undefined) {
      this.droneState.latitude = this.clamp(
        state.latitude,
        CONFIG.DRONE.LATITUDE_MIN,
        CONFIG.DRONE.LATITUDE_MAX
      );
    }
    if (state.longitude !== undefined) {
      this.droneState.longitude = this.normalizeLogitude(state.longitude);
    }
    if (state.elevation !== undefined) {
      this.droneState.elevation = this.clamp(
        state.elevation,
        this.options.minElevation,
        this.options.maxElevation
      );
    }
    if (state.heading !== undefined) {
      this.droneState.heading =
        state.heading % CONFIG.DRONE.HEADING_NORMALIZE_360;
    }

    // Reset velocities when position is set externally
    this.velocityNorth = 0;
    this.velocityEast = 0;
    this.velocityVertical = 0;

    // Update data manager
    this.dataManager.updateDronePosition(
      this.droneState.latitude,
      this.droneState.longitude
    );
  }

  /**
   * Reset velocity (stop all movement)
   */
  public resetVelocity(): void {
    this.velocityNorth = 0;
    this.velocityEast = 0;
    this.velocityVertical = 0;
  }

  /**
   * Utility: Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Utility: Normalize longitude to [-180, 180]
   */
  private normalizeLogitude(lng: number): number {
    return (
      ((lng + CONFIG.DRONE.LONGITUDE_NORMALIZE_MOD) %
        CONFIG.DRONE.LONGITUDE_NORMALIZE_CALC) -
      CONFIG.DRONE.LONGITUDE_NORMALIZE_MOD
    );
  }
}
