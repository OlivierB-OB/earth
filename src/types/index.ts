import * as THREE from 'three';

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
  scene: THREE.Scene | null;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  earth: THREE.Mesh | null;
}

// Focus marker structure
export interface FocusMarkerRef {
  mesh: THREE.Mesh;
  geometry: THREE.SphereGeometry;
  material: THREE.MeshBasicMaterial;
}

// Leaflet helpers
export interface MapClickCallback {
  (latitude: number, longitude: number): void;
}

// Event handlers
export type MouseEventHandler = (event: MouseEvent) => void;
export type WheelEventHandler = (event: WheelEvent) => void;
