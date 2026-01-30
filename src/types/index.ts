/** Represents a geographic location on Earth */
export interface Location {
  /** Latitude in degrees [-90, 90], clamped by LocationContext */
  latitude: number;
  /** Longitude in degrees, normalized to [-180, 180] by LocationContext */
  longitude: number;
}

/** React Context for shared location state across EarthViewer and MapCard */
export interface LocationContextType {
  /** Current focused location */
  location: Location;
  /**
   * Update the focused location and synchronize all views.
   * Coordinates are validated and normalized before storing.
   */
  setFocusedLocation: (latitude: number, longitude: number) => void;
}
