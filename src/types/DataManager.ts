/**
 * Data management types for drone simulator
 */

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Heightfield data for terrain
 */
export interface HeightfieldData {
  width: number;
  height: number;
  minElevation: number;
  maxElevation: number;
  data: number[]; // flattened grid of elevation values
}

/**
 * Contextual data item (building, tree, landmark, etc.)
 */
export interface ContextualItem {
  id: string;
  type: "building" | "tree" | "landmark" | "structure";
  latitude: number;
  longitude: number;
  elevation: number; // base elevation
  height: number; // height of the item above ground
  width?: number;
  depth?: number;
  properties?: Record<string, unknown>;
}

/**
 * A data block represents a spatial region with elevation and contextual data
 */
export interface DataBlock {
  id: string;
  bounds: Bounds;
  elevation: HeightfieldData;
  items: ContextualItem[];
  loadedAt: number; // timestamp when loaded
}

/**
 * Event emitted when data changes
 */
export interface DataChangeEvent {
  type: "load" | "unload" | "update";
  blocks: DataBlock[];
}

export type DataChangeListener = (event: DataChangeEvent) => void;

/**
 * Options for DataManager initialization
 */
export interface DataManagerOptions {
  blockSize?: number; // km, default 1
  loadRadius?: number; // km, default 2
  unloadDistance?: number; // km, default 2.5
  heightfieldResolution?: number; // grid size, default 32
}
