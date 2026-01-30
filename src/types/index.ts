import type {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
} from "three";

// Location types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationContextType {
  location: Location;
  setFocusedLocation: (latitude: number, longitude: number) => void;
}

// Three.js scene refs
export interface ThreeSceneRefs {
  scene: Scene | null;
  renderer: WebGLRenderer | null;
  camera: PerspectiveCamera | null;
  earth: Mesh | null;
}

// Focus marker structure
export interface FocusMarkerRef {
  mesh: Mesh;
  geometry: SphereGeometry;
  material: MeshBasicMaterial;
}

// Leaflet helpers
export interface MapClickCallback {
  (latitude: number, longitude: number): void;
}

// Event handlers
export type MouseEventHandler = (event: MouseEvent) => void;
export type WheelEventHandler = (event: WheelEvent) => void;
