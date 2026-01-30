import {
  Group,
  Mesh,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  MeshPhongMaterial,
  Color,
  Object3D,
} from "three";
import { Viewer3DSceneItem } from "./Viewer3DSceneItem";
import {
  DataBlock,
  ContextualItem,
  DataChangeEvent,
} from "../../types/DataManager";
import { DataManager } from "../dataManager/DataManager";

/**
 * Renders contextual items (buildings, trees, landmarks) from data blocks
 * Updates as drone position changes and data blocks are loaded/unloaded
 */
export class Viewer3DContextLayer extends Viewer3DSceneItem<Group> {
  private itemMeshes: Map<string, Object3D> = new Map();
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
   * Create the main group for context items
   */
  protected makeObject(): Group {
    const group = new Group();
    group.name = "ContextLayer";

    // Subscribe to data manager changes
    this.unsubscribeFromDataManager = this.dataManager.onDataChange((event) => {
      this.handleDataChange(event);
    });

    return group;
  }

  /**
   * Override render to load items after object creation
   */
  override render(): void {
    super.render();
    // Load initial items after object is created
    this.loadInitialItems();
  }

  /**
   * Load items for initially loaded blocks
   */
  private loadInitialItems(): void {
    const blocks = this.dataManager.getLoadedBlocks();
    blocks.forEach((block) => {
      this.addBlockItems(block);
    });
  }

  /**
   * Handle data changes from DataManager
   */
  private handleDataChange(event: DataChangeEvent): void {
    if (event.type === "load") {
      event.blocks.forEach((block) => {
        this.addBlockItems(block);
      });
    } else if (event.type === "unload") {
      event.blocks.forEach((block) => {
        this.removeBlockItems(block.id);
      });
    }
  }

  /**
   * Add all items from a data block
   */
  private addBlockItems(block: DataBlock): void {
    block.items.forEach((item) => {
      this.addItemMesh(item);
    });
  }

  /**
   * Create and add mesh for a contextual item
   */
  private addItemMesh(item: ContextualItem): void {
    if (this.itemMeshes.has(item.id)) {
      return; // Already rendered
    }

    const mesh = this.createItemMesh(item);
    if (mesh) {
      mesh.name = `item_${item.id}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.itemMeshes.set(item.id, mesh);
      this.object.add(mesh);
    }
  }

  /**
   * Remove mesh for an item
   */
  private removeItemMesh(itemId: string): void {
    const mesh = this.itemMeshes.get(itemId);
    if (mesh) {
      this.object.remove(mesh);
      this.disposeMesh(mesh);
      this.itemMeshes.delete(itemId);
    }
  }

  /**
   * Remove all items from a block
   */
  private removeBlockItems(blockId: string): void {
    const itemsToRemove: string[] = [];
    this.itemMeshes.forEach((mesh, itemId) => {
      if (itemId.includes(`${blockId}`)) {
        itemsToRemove.push(itemId);
      }
    });
    itemsToRemove.forEach((itemId) => this.removeItemMesh(itemId));
  }

  /**
   * Create mesh for an item based on type
   */
  private createItemMesh(item: ContextualItem): Mesh | null {
    let geometry;
    let color;

    switch (item.type) {
      case "building": {
        // Buildings are boxes
        const width = item.width || 10;
        const depth = item.depth || 10;
        const height = item.height || 20;
        geometry = new BoxGeometry(width, height, depth);
        color = new Color(0.7, 0.7, 0.7); // Gray
        break;
      }

      case "tree": {
        // Trees are cones on cylinders (trunk + foliage)
        const group = new Group();

        // Trunk
        const trunkGeometry = new CylinderGeometry(
          0.5,
          0.8,
          item.height * 0.3,
          8
        );
        const trunkMaterial = new MeshPhongMaterial({
          color: new Color(0.4, 0.2, 0),
        });
        const trunk = new Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = item.height * 0.15;
        group.add(trunk);

        // Foliage (cone)
        const foliageGeometry = new ConeGeometry(
          item.width || 5,
          item.height * 0.7,
          8
        );
        const foliageMaterial = new MeshPhongMaterial({
          color: new Color(0.2, 0.5, 0.1),
        });
        const foliage = new Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = item.height * 0.65;
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        group.add(foliage);

        const posX = (item.longitude - this.droneLng) * 111000;
        const posZ = (item.latitude - this.droneLat) * 111000;
        group.position.set(posX, item.elevation, posZ);
        group.castShadow = true;
        group.receiveShadow = true;

        this.itemMeshes.set(item.id, group);
        this.object.add(group);
        return null; // We already added it
      }

      case "landmark": {
        // Landmarks are tall structures (boxes)
        const width = item.width || 15;
        const depth = item.depth || 15;
        const height = item.height || 50;
        geometry = new BoxGeometry(width, height, depth);
        color = new Color(0.8, 0.6, 0.2); // Gold
        break;
      }

      case "structure":
      default: {
        // Generic structures
        const width = item.width || 8;
        const depth = item.depth || 8;
        const height = item.height || 15;
        geometry = new BoxGeometry(width, height, depth);
        color = new Color(0.6, 0.6, 0.6); // Light gray
        break;
      }
    }

    if (!geometry) return null;

    const material = new MeshPhongMaterial({
      color,
      emissive: new Color(0.2, 0.2, 0.2),
    });

    const mesh = new Mesh(geometry, material);

    // Position in drone-relative coordinates
    const posX = (item.longitude - this.droneLng) * 111000; // meters (simplified)
    const posZ = (item.latitude - this.droneLat) * 111000; // meters (simplified)
    mesh.position.set(posX, item.elevation + item.height / 2, posZ);

    return mesh;
  }

  /**
   * Recursively dispose mesh and its geometries/materials
   */
  private disposeMesh(mesh: Object3D): void {
    if (mesh instanceof Mesh) {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    }

    if (mesh instanceof Group) {
      mesh.children.forEach((child) => this.disposeMesh(child));
    }
  }

  /**
   * Update item positions (called when drone moves)
   */
  public updateItemPositions(droneLat: number, droneLng: number): void {
    if (droneLat === this.droneLat && droneLng === this.droneLng) {
      return; // No movement
    }

    this.droneLat = droneLat;
    this.droneLng = droneLng;

    // Update positions of all items
    this.itemMeshes.forEach((mesh) => {
      const itemId = mesh.name?.replace("item_", "");
      if (itemId) {
        // Find the item in data blocks
        const blocks = this.dataManager.getLoadedBlocks();
        for (const block of blocks) {
          const item = block.items.find((i: ContextualItem) => i.id === itemId);
          if (item) {
            const posX = (item.longitude - this.droneLng) * 111000;
            const posZ = (item.latitude - this.droneLat) * 111000;
            mesh.position.set(posX, item.elevation + item.height / 2, posZ);
            break;
          }
        }
      }
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

    this.itemMeshes.forEach((mesh) => {
      this.object.remove(mesh);
      this.disposeMesh(mesh);
    });
    this.itemMeshes.clear();

    super.dispose();
  }
}
