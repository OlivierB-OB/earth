import { DataBlock } from "../../types/DataManager";

/**
 * In-memory cache for data blocks with basic eviction support
 */
export class DataBlockCache {
  private cache: Map<string, DataBlock> = new Map();

  /**
   * Get block from cache
   */
  get(id: string): DataBlock | undefined {
    return this.cache.get(id);
  }

  /**
   * Set block in cache
   */
  set(block: DataBlock): void {
    this.cache.set(block.id, block);
  }

  /**
   * Check if block exists in cache
   */
  has(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * Delete block from cache
   */
  delete(id: string): boolean {
    return this.cache.delete(id);
  }

  /**
   * Get all blocks
   */
  getAll(): DataBlock[] {
    return Array.from(this.cache.values());
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}
