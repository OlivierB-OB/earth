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

    this.terrainMeshes.set(block.id, mesh);
    this.object.add(mesh);
    console.log(
      `Added terrain mesh for block ${block.id}. Bounds:`,
      block.bounds
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
    }
  }

  /**
   * Create geometry from elevation data
   */
  private createTerrainGeometry(block: DataBlock): BufferGeometry {
    const { elevation, bounds } = block;
    const { width, height, data } = elevation;

    // Create position attribute for vertices
    const positions: number[] = [];
    const indices: number[] = [];

    // Generate grid of vertices
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

        // Convert to drone-relative 3D position
        // For now, use simplified positioning at ground level
        const posX = (lng - this.droneLng) * 111000; // meters (simplified)
        const posY = elev; // elevation as Y
        const posZ = (lat - this.droneLat) * 111000; // meters (simplified)

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
   */
  public updateTerrainPositions(droneLat: number, droneLng: number): void {
    if (droneLat === this.droneLat && droneLng === this.droneLng) {
      return; // No movement
    }

    this.droneLat = droneLat;
    this.droneLng = droneLng;

    // Rebuild all terrain meshes with new positions relative to drone
    const blocks = Array.from(this.terrainMeshes.keys())
      .map((id) => this.dataManager.getBlock(id))
      .filter((b) => b) as DataBlock[];

    // Clear and rebuild
    this.terrainMeshes.forEach((mesh) => {
      this.object.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof MeshPhongMaterial) {
        mesh.material.dispose();
      }
    });
    this.terrainMeshes.clear();

    // Re-add with new positions
    blocks.forEach((block) => {
      this.addTerrainMesh(block);
    });
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
