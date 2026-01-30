import type {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
} from "three";

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

/** Reference pointers to Three.js scene objects for Viewer3D */
export interface ThreeSceneRefs {
  /** Three.js Scene instance */
  scene: Scene | null;
  /** WebGL Renderer */
  renderer: WebGLRenderer | null;
  /** Perspective camera for viewing the scene */
  camera: PerspectiveCamera | null;
  /** The Earth sphere mesh */
  earth: Mesh | null;
}

/** Structure of the focus marker mesh in 3D space */
export interface FocusMarkerRef {
  /** The Three.js mesh displaying the marker */
  mesh: Mesh;
  /** Sphere geometry for the marker shape */
  geometry: SphereGeometry;
  /** Material determining marker appearance (red, semi-transparent) */
  material: MeshBasicMaterial;
}

/** Callback signature for map click events */
export interface MapClickCallback {
  /**
   * Handle a map click at the specified coordinates.
   * @param latitude - Geographic latitude in degrees
   * @param longitude - Geographic longitude in degrees
   */
  (latitude: number, longitude: number): void;
}

/** Handler for mouse move/drag events */
export type MouseEventHandler = (event: MouseEvent) => void;
/** Handler for mouse wheel scroll events */
export type WheelEventHandler = (event: WheelEvent) => void;
