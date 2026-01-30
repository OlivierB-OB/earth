/**
 * Drone state types for flight simulator
 */

export interface DronePosition {
  latitude: number; // [-90, 90]
  longitude: number; // [-180, 180]
  elevation: number; // meters above sea level
}

export interface DroneState extends DronePosition {
  heading?: number; // compass direction in degrees [0, 360]
}

export interface DroneControls {
  moveForward: boolean;
  moveBack: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  ascend: boolean;
  descend: boolean;
}

export interface DroneContextType {
  // Current drone state
  drone: DroneState;

  // Control inputs
  controls: DroneControls;

  // Actions
  setDronePosition: (position: DronePosition) => void;
  setDroneState: (state: Partial<DroneState>) => void;
  setControls: (controls: Partial<DroneControls>) => void;
  updateControl: (key: keyof DroneControls, value: boolean) => void;
}
