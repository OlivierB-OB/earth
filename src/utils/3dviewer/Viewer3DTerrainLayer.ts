import {
  Group,
  Mesh,
  MeshPhongMaterial,
  BufferGeometry,
  BufferAttribute,
  Color,
} from "three";
import { Viewer3DSceneItem } from "./Viewer3DSceneItem";
import { DataBlock, DataChangeEvent } from "../../types/DataManager";
import { DataManager } from "../dataManager/DataManager";
import { MercatorConverter } from "./utils/MercatorConverter";

/**
 * Renders terrain mesh from elevation data blocks
 * Updates as drone position changes and new data blocks are loaded
 */
export class Viewer3DTerrainLayer extends Viewer3DSceneItem<Group> {
  private terrainMeshes: Map<string, Mesh> = new Map();
  private meshOffsets: Map<string, { x: number; z: number }> = new Map();
  private dataManager: DataManager;
  private unsubscribeFromDataManager: (() => void) | null = null;
  private droneLat: number = 0;
  private droneLng: number = 0;

  constructor(dataManager: DataManager) {
    super();
    this.dataManager = dataManager;
  }

  /**
   * Set drone position for coordinate conversions
   */
  public setDronePosition(latitude: number, longitude: number): void {
    this.droneLat = latitude;
    this.droneLng = longitude;
  }

  /**
   * Create the main group for terrain meshes
   */
  protected makeObject(): Group {
    const group = new Group();
    group.name = "TerrainLayer";

    // Subscribe to data manager changes
    this.unsubscribeFromDataManager = this.dataManager.onDataChange((event) => {
      this.handleDataChange(event);
    });

    return group;
  }

  /**
   * Terrain items are loaded via data change events, not during render
   */
  override render(): void {
    super.render();
    // Terrain loading is handled by handleDataChange() when data becomes available
  }

  /**
   * Handle data changes from DataManager
   */
  private handleDataChange(event: DataChangeEvent): void {
    if (event.type === "load") {
      event.blocks.forEach((block) => {
        this.addTerrainMesh(block);
      });
      // Mark renderer dirty so changes are visible
      this.scene.viewer.renderer.markDirty();
    } else if (event.type === "unload") {
      event.blocks.forEach((block) => {
        this.removeTerrainMesh(block.id);
      });
      // Mark renderer dirty so changes are visible
      this.scene.viewer.renderer.markDirty();
    }
  }

  /**
   * Create and add terrain mesh for a data block
   */
  private addTerrainMesh(block: DataBlock): void {
    if (this.terrainMeshes.has(block.id)) {
      return; // Already rendered
    }

    // Calculate block center offset from drone (in meters) using Mercator projection
    const blockCenterLat = (block.bounds.north + block.bounds.south) / 2;
    const blockCenterLng = (block.bounds.east + block.bounds.west) / 2;
    const [blockMercX, blockMercY] = MercatorConverter.latLngToMeters(
      blockCenterLat,
      blockCenterLng
    );
    const [droneMercX, droneMercY] = MercatorConverter.latLngToMeters(
      this.droneLat,
      this.droneLng
    );
    const offsetX = blockMercX - droneMercX;
    const offsetZ = blockMercY - droneMercY;

    // Store offsets for later transform updates
    this.meshOffsets.set(block.id, { x: offsetX, z: offsetZ });

    const geometry = this.createTerrainGeometry(block);
    const material = new MeshPhongMaterial({
      color: new Color(0.2, 0.6, 0.2), // Green terrain
      emissive: new Color(0.1, 0.3, 0.1),
      flatShading: false,
      wireframe: false,
    });

    const mesh = new Mesh(geometry, material);
    mesh.name = `terrain_${block.id}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(offsetX, 0, offsetZ);

    this.terrainMeshes.set(block.id, mesh);
    this.object.add(mesh);
    console.debug(
      `[Data Blocks] Terrain block added: ${block.id} (${block.bounds.south.toFixed(2)}, ${block.bounds.west.toFixed(2)}) - Total blocks: ${this.terrainMeshes.size}`
    );
  }

  /**
   * Remove terrain mesh for a block
   */
  private removeTerrainMesh(blockId: string): void {
    const mesh = this.terrainMeshes.get(blockId);
    if (mesh) {
      this.object.remove(mesh);

      // Dispose resources
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material instanceof MeshPhongMaterial) {
        mesh.material.dispose();
      }

      this.terrainMeshes.delete(blockId);
      console.debug(
        `[Data Blocks] Terrain block removed: ${blockId} - Total blocks: ${this.terrainMeshes.size}`
      );
    }
  }

  /**
   * Create geometry from elevation data
   * Vertices are positioned relative to block center (not drone-relative)
   */
  private createTerrainGeometry(block: DataBlock): BufferGeometry {
    const { elevation, bounds } = block;
    const { width, height, data } = elevation;

    // Calculate block center for local positioning
    const blockCenterLat = (bounds.north + bounds.south) / 2;
    const blockCenterLng = (bounds.east + bounds.west) / 2;

    // Create position attribute for vertices
    const positions: number[] = [];
    const indices: number[] = [];

    // Generate grid of vertices (relative to block center)
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const index = row * width + col;
        const elev = data[index];

        // Normalize grid position to [0, 1]
        const x = col / (width - 1);
        const y = row / (height - 1);

        // Convert to lat/lng
        const lat = bounds.south + y * (bounds.north - bounds.south);
        const lng = bounds.west + x * (bounds.east - bounds.west);

        // Convert to 3D position relative to block center (mesh-local coordinates) using Mercator
        const [mercX, mercY] = MercatorConverter.latLngToMeters(lat, lng);
        const [blockCenterMercX, blockCenterMercY] =
          MercatorConverter.latLngToMeters(blockCenterLat, blockCenterLng);
        const posX = mercX - blockCenterMercX;
        const posY = elev; // elevation as Y
        const posZ = mercY - blockCenterMercY;

        positions.push(posX, posY, posZ);
      }
    }

    // Generate indices for triangle strips
    for (let row = 0; row < height - 1; row++) {
      for (let col = 0; col < width - 1; col++) {
        const a = row * width + col;
        const b = a + 1;
        const c = a + width;
        const d = c + 1;

        // Two triangles per grid square
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    // Create geometry
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(positions), 3)
    );
    geometry.setIndex(new BufferAttribute(new Uint32Array(indices), 1));

    // Calculate normals for proper lighting
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Update terrain positions (called when drone moves)
   * With the fix to call dataManager.updateDronePosition() in the update loop,
   * this method is mostly deprecated. Meshes are recreated fresh via data load/unload events.
   * We keep this for backward compatibility and as a safeguard.
   */
  public updateTerrainPositions(droneLat: number, droneLng: number): void {
    if (droneLat === this.droneLat && droneLng === this.droneLng) {
      return; // No movement
    }

    this.droneLat = droneLat;
    this.droneLng = droneLng;
    // Data reload is handled by dataManager.updateDronePosition() call in EarthViewer
  }

  /**
   * Get the current drone world position (used for camera following)
   * Returns the world coordinates of the drone based on current lat/lng
   */
  public getLastDroneWorldPosition(): { x: number; z: number } {
    // Drone is always at the world origin (0, 0) in the scene
    // But we need to return the offset that was calculated for positioning
    // Since the drone is at center, the offset IS the world position of the drone
    return { x: 0, z: 0 };
  }

  /**
   * Clean up resources
   */
  override dispose(): void {
    if (this.unsubscribeFromDataManager) {
      this.unsubscribeFromDataManager();
      this.unsubscribeFromDataManager = null;
    }

    this.terrainMeshes.forEach((mesh) => {
      this.object.remove(mesh);
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material instanceof MeshPhongMaterial) {
        mesh.material.dispose();
      }
    });
    this.terrainMeshes.clear();

    super.dispose();
  }
}
