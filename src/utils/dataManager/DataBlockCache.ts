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
   * Get blocks by IDs
   */
  getByIds(ids: string[]): DataBlock[] {
    return ids
      .map((id) => this.cache.get(id))
      .filter((block) => block !== undefined) as DataBlock[];
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

  /**
   * Delete blocks by ID list
   */
  deleteMany(ids: string[]): void {
    ids.forEach((id) => this.cache.delete(id));
  }
}
