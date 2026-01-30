import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  DroneContextType,
  DroneState,
  DronePosition,
  DroneControls,
} from "../types/Drone";

// Create context
const DroneContextInstance = createContext<DroneContextType | undefined>(
  undefined
);

// Default initial drone state
const defaultDroneState: DroneState = {
  latitude: 0,
  longitude: 0,
  elevation: 100, // meters
  heading: 0,
};

const defaultControls: DroneControls = {
  moveForward: false,
  moveBack: false,
  moveLeft: false,
  moveRight: false,
  ascend: false,
  descend: false,
};

/**
 * Provider component for drone context
 */
export const DroneProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [drone, setDrone] = useState<DroneState>(defaultDroneState);
  const [controls, setControls] = useState<DroneControls>(defaultControls);

  /**
   * Normalize coordinates to valid ranges
   */
  const normalizeCoordinates = useCallback(
    (position: DronePosition): DronePosition => {
      let { latitude, longitude, elevation } = position;

      // Clamp latitude to [-90, 90]
      latitude = Math.max(-90, Math.min(90, latitude));

      // Normalize longitude to [-180, 180]
      longitude = ((longitude + 180) % 360) - 180;

      // Ensure elevation is non-negative
      elevation = Math.max(0, elevation);

      return { latitude, longitude, elevation };
    },
    []
  );

  /**
   * Set drone position
   */
  const setDronePosition = useCallback(
    (position: DronePosition) => {
      const normalized = normalizeCoordinates(position);
      setDrone((prev) => ({
        ...prev,
        ...normalized,
      }));
    },
    [normalizeCoordinates]
  );

  /**
   * Set full drone state (position + heading)
   */
  const setDroneState = useCallback(
    (state: Partial<DroneState>) => {
      const normalized = normalizeCoordinates({
        latitude: state.latitude ?? drone.latitude,
        longitude: state.longitude ?? drone.longitude,
        elevation: state.elevation ?? drone.elevation,
      });

      setDrone((prev) => ({
        ...prev,
        ...normalized,
        heading: state.heading ?? prev.heading,
      }));
    },
    [drone, normalizeCoordinates]
  );

  /**
   * Set control state (replace all controls)
   */
  const setControlsState = useCallback(
    (newControls: Partial<DroneControls>) => {
      setControls((prev) => ({
        ...prev,
        ...newControls,
      }));
    },
    []
  );

  /**
   * Update a single control
   */
  const updateControl = useCallback(
    (key: keyof DroneControls, value: boolean) => {
      setControls((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const value: DroneContextType = {
    drone,
    controls,
    setDronePosition,
    setDroneState,
    setControls: setControlsState,
    updateControl,
  };

  return (
    <DroneContextInstance.Provider value={value}>
      {children}
    </DroneContextInstance.Provider>
  );
};

/**
 * Hook to access drone context
 */
export const useDrone = (): DroneContextType => {
  const context = useContext(DroneContextInstance);
  if (!context) {
    throw new Error("useDrone must be used within DroneProvider");
  }
  return context;
};

/**
 * Hook to access just drone controls
 */
export const useDroneControls = () => {
  const { controls, updateControl } = useDrone();
  return { controls, updateControl };
};
