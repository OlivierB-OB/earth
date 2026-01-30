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
import { MercatorConverter } from "./utils/MercatorConverter";

/**
 * Renders contextual items (buildings, trees, landmarks) from data blocks
 * Updates as drone position changes and data blocks are loaded/unloaded
 */
export class Viewer3DContextLayer extends Viewer3DSceneItem<Group> {
  private itemMeshes: Map<string, Object3D> = new Map();
  private itemData: Map<string, ContextualItem> = new Map();
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
   * Context items are loaded via data change events, not during render
   */
  override render(): void {
    super.render();
    // Item loading is handled by handleDataChange() when data becomes available
  }

  /**
   * Handle data changes from DataManager
   */
  private handleDataChange(event: DataChangeEvent): void {
    if (event.type === "load") {
      event.blocks.forEach((block) => {
        this.addBlockItems(block);
      });
      // Mark renderer dirty so changes are visible
      this.scene.viewer.renderer.markDirty();
    } else if (event.type === "unload") {
      event.blocks.forEach((block) => {
        this.removeBlockItems(block.id);
      });
      // Mark renderer dirty so changes are visible
      this.scene.viewer.renderer.markDirty();
    }
  }

  /**
   * Add all items from a data block
   */
  private addBlockItems(block: DataBlock): void {
    block.items.forEach((item) => {
      this.addItemMesh(item, block);
    });
    console.debug(
      `[Data Blocks] Context items block added: ${block.id} (${block.items.length} items) - Total items: ${this.itemMeshes.size}`
    );
  }

  /**
   * Create and add mesh for a contextual item
   */
  private addItemMesh(item: ContextualItem, block: DataBlock): void {
    if (this.itemMeshes.has(item.id)) {
      return; // Already rendered
    }

    // Cache the item data for fast lookups during position updates
    this.itemData.set(item.id, item);

    const mesh = this.createItemMesh(item, block);
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
      this.itemData.delete(itemId);
      console.debug(
        `[Data Blocks] Context item removed: ${itemId} - Total items: ${this.itemMeshes.size}`
      );
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
  private createItemMesh(item: ContextualItem, block: DataBlock): Object3D | null {
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

        // Position relative to block center, then offset from drone using Mercator projection
        const blockCenterLat = (block.bounds.north + block.bounds.south) / 2;
        const blockCenterLng = (block.bounds.east + block.bounds.west) / 2;
        const [itemMercX, itemMercY] = MercatorConverter.latLngToMeters(
          item.latitude,
          item.longitude
        );
        const [blockCenterMercX, blockCenterMercY] = MercatorConverter.latLngToMeters(
          blockCenterLat,
          blockCenterLng
        );
        const [droneMercX, droneMercY] = MercatorConverter.latLngToMeters(
          this.droneLat,
          this.droneLng
        );
        const posX = itemMercX - blockCenterMercX;
        const posZ = itemMercY - blockCenterMercY;
        const blockOffsetX = blockCenterMercX - droneMercX;
        const blockOffsetZ = blockCenterMercY - droneMercY;
        group.position.set(posX + blockOffsetX, item.elevation, posZ + blockOffsetZ);
        group.castShadow = true;
        group.receiveShadow = true;

        return group;
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

    // Position relative to block center, then offset from drone using Mercator projection
    const blockCenterLat = (block.bounds.north + block.bounds.south) / 2;
    const blockCenterLng = (block.bounds.east + block.bounds.west) / 2;
    const [itemMercX, itemMercY] = MercatorConverter.latLngToMeters(
      item.latitude,
      item.longitude
    );
    const [blockCenterMercX, blockCenterMercY] = MercatorConverter.latLngToMeters(
      blockCenterLat,
      blockCenterLng
    );
    const [droneMercX, droneMercY] = MercatorConverter.latLngToMeters(
      this.droneLat,
      this.droneLng
    );
    const posX = itemMercX - blockCenterMercX;
    const posZ = itemMercY - blockCenterMercY;
    const blockOffsetX = blockCenterMercX - droneMercX;
    const blockOffsetZ = blockCenterMercY - droneMercY;
    mesh.position.set(posX + blockOffsetX, item.elevation + item.height / 2, posZ + blockOffsetZ);

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
   * With the fix to call dataManager.updateDronePosition() in the update loop,
   * this method is mostly deprecated. Meshes are recreated fresh via data load/unload events.
   * We keep this for backward compatibility and as a safeguard.
   */
  public updateItemPositions(droneLat: number, droneLng: number): void {
    if (droneLat === this.droneLat && droneLng === this.droneLng) {
      return; // No movement
    }

    this.droneLat = droneLat;
    this.droneLng = droneLng;
    // Data reload is handled by dataManager.updateDronePosition() call in EarthViewer
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
    this.itemData.clear();

    super.dispose();
  }
}
