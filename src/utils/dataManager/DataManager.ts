import {
  DataBlock,
  DataChangeEvent,
  DataChangeListener,
  DataManagerOptions,
} from "../../types/DataManager";
import { DataBlockCache } from "./DataBlockCache";
import { MockDataGenerator } from "./MockDataGenerator";
import { MercatorConverter } from "../3dviewer/utils/MercatorConverter";

/**
 * Manages spatial data blocks around the drone
 * Handles loading, unloading, and caching of elevation + contextual data
 */
export class DataManager {
  private cache: DataBlockCache;
  private generator: MockDataGenerator;
  private listeners: Set<DataChangeListener> = new Set();

  private blockSize: number;
  private loadRadius: number;
  private unloadDistance: number;

  private lastDronePosition: { lat: number; lng: number } | null = null;

  constructor(options: DataManagerOptions = {}) {
    this.blockSize = options.blockSize || 1; // km
    this.loadRadius = options.loadRadius || 2; // km
    this.unloadDistance = options.unloadDistance || 2.5; // km

    this.cache = new DataBlockCache();
    this.generator = new MockDataGenerator(options);
  }

  /**
   * Update drone position and load/unload data accordingly
   */
  public updateDronePosition(latitude: number, longitude: number): void {
    // Only process if drone has moved significantly
    if (
      this.lastDronePosition &&
      this.distanceBetweenCoords(
        this.lastDronePosition.lat,
        this.lastDronePosition.lng,
        latitude,
        longitude
      ) < 0.1
    ) {
      return;
    }

    this.lastDronePosition = { lat: latitude, lng: longitude };

    // Load new blocks within load radius
    const blocksToLoad = this.getBlocksInRadius(
      latitude,
      longitude,
      this.loadRadius
    );
    const newBlocksToLoad = blocksToLoad.filter((id) => !this.cache.has(id));

    if (newBlocksToLoad.length > 0) {
      this.loadBlocks(newBlocksToLoad);
    }

    // Unload distant blocks
    const cachedBlocks = this.cache.getAll();
    const blocksToUnload = cachedBlocks.filter((block) => {
      const blockCenter = this.getBlockCenter(block.bounds);
      const distance = this.distanceBetweenCoords(
        latitude,
        longitude,
        blockCenter.lat,
        blockCenter.lng
      );
      return distance > this.unloadDistance;
    });

    if (blocksToUnload.length > 0) {
      this.unloadBlocks(blocksToUnload.map((b) => b.id));
    }
  }

  /**
   * Get all currently loaded blocks
   */
  public getLoadedBlocks(): DataBlock[] {
    return this.cache.getAll();
  }

  /**
   * Get block by ID
   */
  public getBlock(id: string): DataBlock | undefined {
    return this.cache.get(id);
  }

  /**
   * Subscribe to data changes
   */
  public onDataChange(listener: DataChangeListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispose and clean up
   */
  public dispose(): void {
    this.cache.clear();
    this.listeners.clear();
  }

  /**
   * Load blocks and emit change event
   */
  private loadBlocks(blockIds: string[]): void {
    const loadedBlocks: DataBlock[] = [];

    for (const id of blockIds) {
      const [latStr, lngStr] = id.replace("block_", "").split("_");
      const blockLat = parseFloat(latStr);
      const blockLng = parseFloat(lngStr);

      const block = this.generator.generateBlock(blockLat, blockLng);
      this.cache.set(block);
      loadedBlocks.push(block);
    }

    this.emitDataChange({ type: "load", blocks: loadedBlocks });
  }

  /**
   * Unload blocks and emit change event
   */
  private unloadBlocks(blockIds: string[]): void {
    const unloadedBlocks: DataBlock[] = [];

    for (const id of blockIds) {
      const block = this.cache.get(id);
      if (block) {
        unloadedBlocks.push(block);
        this.cache.delete(id);
      }
    }

    if (unloadedBlocks.length > 0) {
      this.emitDataChange({ type: "unload", blocks: unloadedBlocks });
    }
  }

  /**
   * Emit data change event to all listeners
   */
  private emitDataChange(event: DataChangeEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in data change listener:", error);
      }
    });
  }

  /**
   * Get all block IDs that should be loaded within radius
   */
  private getBlocksInRadius(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): string[] {
    const blockIds: string[] = [];
    const blocksPerSide = Math.ceil(radiusKm / this.blockSize) + 1;

    for (
      let latOffset = -blocksPerSide;
      latOffset <= blocksPerSide;
      latOffset++
    ) {
      for (
        let lngOffset = -blocksPerSide;
        lngOffset <= blocksPerSide;
        lngOffset++
      ) {
        const blockLat =
          Math.round(centerLat / this.blockSize) * this.blockSize +
          latOffset * this.blockSize;
        const blockLng =
          Math.round(centerLng / this.blockSize) * this.blockSize +
          lngOffset * this.blockSize;

        // Check if block is within load radius
        const distance = this.distanceBetweenCoords(
          centerLat,
          centerLng,
          blockLat,
          blockLng
        );
        if (distance <= radiusKm) {
          blockIds.push(`block_${blockLat}_${blockLng}`);
        }
      }
    }

    return blockIds;
  }

  /**
   * Get center point of block bounds
   */
  private getBlockCenter(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): {
    lat: number;
    lng: number;
  } {
    return {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2,
    };
  }

  /**
   * Calculate distance between two coordinates in km using Mercator projection
   * Provides accurate distance at any latitude
   */
  private distanceBetweenCoords(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const distanceInMeters = MercatorConverter.distanceInMeters(
      lat1,
      lng1,
      lat2,
      lng2
    );
    return distanceInMeters / 1000; // convert to km
  }
}
