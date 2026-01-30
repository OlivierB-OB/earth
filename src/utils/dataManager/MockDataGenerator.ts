import {
  DataBlock,
  HeightfieldData,
  ContextualItem,
  Bounds,
  DataManagerOptions,
} from "../../types/DataManager";

/**
 * Generates mock elevation and contextual data using deterministic procedural generation
 */
export class MockDataGenerator {
  private blockSize: number;
  private heightfieldResolution: number;

  constructor(options: DataManagerOptions = {}) {
    this.blockSize = options.blockSize || 1; // km
    this.heightfieldResolution = options.heightfieldResolution || 32; // 32x32 grid
  }

  /**
   * Generate a data block for given latitude and longitude
   */
  generateBlock(blockLat: number, blockLng: number): DataBlock {
    const id = `block_${blockLat}_${blockLng}`;
    const bounds = this.calculateBounds(blockLat, blockLng);

    // Generate elevation data
    const elevation = this.generateElevationData(blockLat, blockLng);

    // Generate contextual items (buildings, trees, etc.)
    const items = this.generateContextualItems(blockLat, blockLng, elevation);

    return {
      id,
      bounds,
      elevation,
      items,
      loadedAt: Date.now(),
    };
  }

  /**
   * Calculate bounds for a block at given lat/lng
   * Converts blockSize (km) to degrees of latitude/longitude
   */
  private calculateBounds(blockLat: number, blockLng: number): Bounds {
    // Convert km to degrees
    // Latitude: 1 degree ≈ 111 km (constant)
    const latOffsetDeg = this.blockSize / 2 / 111;

    // Longitude: 1 degree ≈ 111 * cos(latitude) km (varies by latitude)
    const lngOffsetDeg = (this.blockSize / 2) / (111 * Math.cos(blockLat * Math.PI / 180));

    return {
      north: blockLat + latOffsetDeg,
      south: blockLat - latOffsetDeg,
      east: blockLng + lngOffsetDeg,
      west: blockLng - lngOffsetDeg,
    };
  }

  /**
   * Generate elevation data using Perlin-like noise (using simple sine/cosine)
   */
  private generateElevationData(
    blockLat: number,
    blockLng: number
  ): HeightfieldData {
    const data: number[] = [];
    const resolution = this.heightfieldResolution;
    let minElevation = Infinity;
    let maxElevation = -Infinity;

    const bounds = this.calculateBounds(blockLat, blockLng);
    const latStep = (bounds.north - bounds.south) / resolution;
    const lngStep = (bounds.east - bounds.west) / resolution;

    for (let row = 0; row < resolution; row++) {
      for (let col = 0; col < resolution; col++) {
        const lat = bounds.south + row * latStep;
        const lng = bounds.west + col * lngStep;

        // Multi-octave noise for realistic terrain
        const elevation = this.perlinLike(lat, lng, blockLat, blockLng);

        data.push(elevation);
        minElevation = Math.min(minElevation, elevation);
        maxElevation = Math.max(maxElevation, elevation);
      }
    }

    return {
      width: resolution,
      height: resolution,
      minElevation,
      maxElevation,
      data,
    };
  }

  /**
   * Pseudo-Perlin noise using sine/cosine combinations
   * Creates realistic rolling terrain based on coordinates
   */
  private perlinLike(
    lat: number,
    lng: number,
    blockLat: number,
    blockLng: number
  ): number {
    // Base elevation varies by region
    const baseElevation =
      50 + Math.sin(blockLat * 0.05) * 100 + Math.cos(blockLng * 0.05) * 80;

    // Large hills
    const hills1 = Math.sin(lat * 2) * Math.cos(lng * 2) * 60;
    const hills2 = Math.sin((lat + lng) * 1.5) * 40;

    // Medium features
    const features1 = Math.sin(lat * 5) * Math.cos(lng * 5) * 20;
    const features2 = Math.sin((lat - lng) * 3) * 15;

    // Small details
    const details = Math.sin(lat * 13) * Math.cos(lng * 11) * 5;

    const totalElevation =
      baseElevation + hills1 + hills2 + features1 + features2 + details;

    // Clamp to reasonable range (0-500m)
    return Math.max(0, Math.min(500, totalElevation));
  }

  /**
   * Generate contextual items (buildings, trees, landmarks) for a block
   */
  private generateContextualItems(
    blockLat: number,
    blockLng: number,
    elevation: HeightfieldData
  ): ContextualItem[] {
    const items: ContextualItem[] = [];
    const seed = this.hashCoordinates(blockLat, blockLng);
    const bounds = this.calculateBounds(blockLat, blockLng);

    // Determine number of items based on seed (creates consistent distribution)
    const numItems = 5 + Math.floor(this.seededRandom(seed) * 15);
    console.debug(`[Data Generation] Generating contextual items for block (${blockLat}, ${blockLng}): ${numItems} items`);

    for (let i = 0; i < numItems; i++) {
      const itemSeed = seed + i * 12345;
      const itemLat =
        bounds.south +
        this.seededRandom(itemSeed) * (bounds.north - bounds.south);
      const itemLng =
        bounds.west +
        this.seededRandom(itemSeed + 1) * (bounds.east - bounds.west);

      // Get elevation at this location
      const itemElevation = this.getElevationAtLatLng(
        itemLat,
        itemLng,
        elevation,
        bounds
      );

      // Determine item type
      const typeRandom = this.seededRandom(itemSeed + 2);
      let type: "building" | "tree" | "landmark" | "structure";
      let height: number;

      if (typeRandom < 0.1) {
        type = "landmark";
        height = 30 + this.seededRandom(itemSeed + 3) * 70;
      } else if (typeRandom < 0.3) {
        type = "building";
        height = 10 + this.seededRandom(itemSeed + 3) * 30;
      } else {
        type = "tree";
        height = 15 + this.seededRandom(itemSeed + 3) * 20;
      }

      items.push({
        id: `item_${blockLat}_${blockLng}_${i}`,
        type,
        latitude: itemLat,
        longitude: itemLng,
        elevation: itemElevation,
        height,
        width: this.seededRandom(itemSeed + 4) * 10 + 5,
        depth: this.seededRandom(itemSeed + 5) * 10 + 5,
      });
    }

    return items;
  }

  /**
   * Get elevation at specific lat/lng within a heightfield
   */
  private getElevationAtLatLng(
    lat: number,
    lng: number,
    elevation: HeightfieldData,
    bounds: Bounds
  ): number {
    const { width, height, data } = elevation;

    // Normalize coordinates to [0, 1]
    const x = (lng - bounds.west) / (bounds.east - bounds.west);
    const y = (lat - bounds.south) / (bounds.north - bounds.south);

    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    // Get grid position
    const col = Math.floor(clampedX * (width - 1));
    const row = Math.floor(clampedY * (height - 1));
    const index = row * width + col;

    return data[index] || 0;
  }

  /**
   * Hash coordinates for deterministic seeding
   */
  private hashCoordinates(lat: number, lng: number): number {
    const latInt = Math.floor(lat * 1000);
    const lngInt = Math.floor(lng * 1000);
    let hash = 5381;
    hash = (hash << 5) + hash + latInt;
    hash = (hash << 5) + hash + lngInt;
    return Math.abs(hash);
  }

  /**
   * Seeded pseudo-random number generator [0, 1)
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}
