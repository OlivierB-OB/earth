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
  private lastOffsetLat: number = 0;
  private lastOffsetLng: number = 0;

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
   * Override render to load terrain after object creation
   */
  override render(): void {
    super.render();
    // Load initial terrain after object is created
    this.loadInitialTerrain();
  }

  /**
   * Load terrain for initially loaded blocks
   */
  private loadInitialTerrain(): void {
    const blocks = this.dataManager.getLoadedBlocks();
    blocks.forEach((block) => {
      this.addTerrainMesh(block);
    });
  }

  /**
   * Handle data changes from DataManager
   */
  private handleDataChange(event: DataChangeEvent): void {
    if (event.type === "load") {
      event.blocks.forEach((block) => {
        this.addTerrainMesh(block);
      });
    } else if (event.type === "unload") {
      event.blocks.forEach((block) => {
        this.removeTerrainMesh(block.id);
      });
    }
  }

  /**
   * Create and add terrain mesh for a data block
   */
  private addTerrainMesh(block: DataBlock): void {
    if (this.terrainMeshes.has(block.id)) {
      return; // Already rendered
    }

    // Calculate block center offset from drone (in meters)
    const blockCenterLat = (block.bounds.north + block.bounds.south) / 2;
    const blockCenterLng = (block.bounds.east + block.bounds.west) / 2;
    const offsetX = (blockCenterLng - this.droneLng) * 111000;
    const offsetZ = (blockCenterLat - this.droneLat) * 111000;

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

        // Convert to 3D position relative to block center (mesh-local coordinates)
        const posX = (lng - blockCenterLng) * 111000; // meters (simplified)
        const posY = elev; // elevation as Y
        const posZ = (lat - blockCenterLat) * 111000; // meters (simplified)

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
   * Instead of rebuilding geometries, we update mesh transforms efficiently
   */
  public updateTerrainPositions(droneLat: number, droneLng: number): void {
    if (droneLat === this.droneLat && droneLng === this.droneLng) {
      return; // No movement
    }

    this.droneLat = droneLat;
    this.droneLng = droneLng;
    this.lastOffsetLat = droneLat;
    this.lastOffsetLng = droneLng;

    // Update each mesh position by translating it
    // This is O(n) for n meshes, but no geometry reconstruction
    this.terrainMeshes.forEach((mesh, blockId) => {
      const offset = this.meshOffsets.get(blockId);
      if (offset) {
        // Recalculate offset based on new drone position
        const block = this.dataManager.getBlock(blockId);
        if (block) {
          const blockCenterLat = (block.bounds.north + block.bounds.south) / 2;
          const blockCenterLng = (block.bounds.east + block.bounds.west) / 2;
          const newOffsetX = (blockCenterLng - droneLng) * 111000;
          const newOffsetZ = (blockCenterLat - droneLat) * 111000;

          mesh.position.x = newOffsetX;
          mesh.position.z = newOffsetZ;

          offset.x = newOffsetX;
          offset.z = newOffsetZ;
        }
      }
    });

    // Mark renderer as dirty so it renders the updated positions
    this.scene.viewer.renderer.markDirty();
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
