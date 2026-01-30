import { CONFIG } from "../../config";
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
    this.blockSize = options.blockSize || CONFIG.DATA_MANAGEMENT.BLOCK_SIZE_M;
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
   * Converts blockSize (meters) to degrees of latitude/longitude
   */
  private calculateBounds(blockLat: number, blockLng: number): Bounds {
    // Convert meters to degrees
    // Latitude: 1 degree ≈ 111 meters per degree (constant)
    const latOffsetDeg =
      this.blockSize / 2 / CONFIG.TERRAIN.METERS_PER_DEGREE_LAT;

    // Longitude: 1 degree ≈ 111 * cos(latitude) meters per degree (varies by latitude)
    const lngOffsetDeg =
      this.blockSize /
      2 /
      (CONFIG.TERRAIN.METERS_PER_DEGREE_LNG *
        Math.cos((blockLat * Math.PI) / 180));

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
      CONFIG.TERRAIN.BASE_ELEVATION_OFFSET +
      Math.sin(blockLat * CONFIG.TERRAIN.BASE_ELEVATION_LAT_FREQ) *
        CONFIG.TERRAIN.BASE_ELEVATION_LAT_AMP +
      Math.cos(blockLng * CONFIG.TERRAIN.BASE_ELEVATION_LNG_FREQ) *
        CONFIG.TERRAIN.BASE_ELEVATION_LNG_AMP;

    // Large hills
    const hills1 =
      Math.sin(lat * CONFIG.TERRAIN.HILL_LAT_FREQ) *
      Math.cos(lng * CONFIG.TERRAIN.HILL_LNG_FREQ) *
      CONFIG.TERRAIN.HILL_AMP;
    const hills2 =
      Math.sin((lat + lng) * CONFIG.TERRAIN.FEATURE_LAT_LNG_FREQ) *
      CONFIG.TERRAIN.FEATURE_AMP;

    // Medium features
    const features1 =
      Math.sin(lat * CONFIG.TERRAIN.MEDIUM_FEATURE_FREQ) *
      Math.cos(lng * CONFIG.TERRAIN.MEDIUM_FEATURE_LNG_FREQ) *
      CONFIG.TERRAIN.MEDIUM_FEATURE_AMP;
    const features2 =
      Math.sin((lat - lng) * CONFIG.TERRAIN.DETAIL_FREQ) *
      CONFIG.TERRAIN.DETAIL_AMP;

    // Small details
    const details =
      Math.sin(lat * CONFIG.TERRAIN.FINE_DETAIL_LAT_FREQ) *
      Math.cos(lng * CONFIG.TERRAIN.FINE_DETAIL_LNG_FREQ) *
      CONFIG.TERRAIN.FINE_DETAIL_AMP;

    const totalElevation =
      baseElevation + hills1 + hills2 + features1 + features2 + details;

    // Clamp to reasonable range
    return Math.max(
      CONFIG.TERRAIN.ELEVATION_MIN,
      Math.min(CONFIG.TERRAIN.ELEVATION_MAX, totalElevation)
    );
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
    const numItems =
      CONFIG.CONTEXT_DATA.ITEMS_PER_BLOCK_MIN +
      Math.floor(
        this.seededRandom(seed) * CONFIG.CONTEXT_DATA.ITEMS_PER_BLOCK_MAX
      );
    console.debug(
      `[Data Generation] Generating contextual items for block (${blockLat}, ${blockLng}): ${numItems} items`
    );

    for (let i = 0; i < numItems; i++) {
      const itemSeed = seed + i * CONFIG.CONTEXT_DATA.SEED_INCREMENT;
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

      if (typeRandom < CONFIG.CONTEXT_DATA.LANDMARK_PROBABILITY) {
        type = "landmark";
        height =
          CONFIG.CONTEXT_DATA.LANDMARK_HEIGHT_MIN +
          this.seededRandom(itemSeed + 3) *
            CONFIG.CONTEXT_DATA.LANDMARK_HEIGHT_RANGE;
      } else if (typeRandom < CONFIG.CONTEXT_DATA.BUILDING_PROBABILITY) {
        type = "building";
        height =
          CONFIG.CONTEXT_DATA.BUILDING_HEIGHT_MIN +
          this.seededRandom(itemSeed + 3) *
            CONFIG.CONTEXT_DATA.BUILDING_HEIGHT_RANGE;
      } else {
        type = "tree";
        height =
          CONFIG.CONTEXT_DATA.TREE_HEIGHT_MIN +
          this.seededRandom(itemSeed + 3) *
            CONFIG.CONTEXT_DATA.TREE_HEIGHT_RANGE;
      }

      items.push({
        id: `item_${blockLat}_${blockLng}_${i}`,
        type,
        latitude: itemLat,
        longitude: itemLng,
        elevation: itemElevation,
        height,
        width:
          this.seededRandom(itemSeed + 4) * CONFIG.CONTEXT_DATA.ITEM_WIDTH_MAX +
          CONFIG.CONTEXT_DATA.ITEM_WIDTH_OFFSET,
        depth:
          this.seededRandom(itemSeed + 5) * CONFIG.CONTEXT_DATA.ITEM_DEPTH_MAX +
          CONFIG.CONTEXT_DATA.ITEM_DEPTH_OFFSET,
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
    const latInt = Math.floor(lat * CONFIG.CONTEXT_DATA.COORDINATE_HASH_MULT);
    const lngInt = Math.floor(lng * CONFIG.CONTEXT_DATA.COORDINATE_HASH_MULT);
    let hash = CONFIG.CONTEXT_DATA.HASH_INITIAL_VALUE;
    hash = (hash << CONFIG.CONTEXT_DATA.HASH_SHIFT_LEFT) + hash + latInt;
    hash = (hash << CONFIG.CONTEXT_DATA.HASH_SHIFT_LEFT) + hash + lngInt;
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
