import type { IFlatMap } from "./IFlatMap";

/**
 * IFlatMapEventHandler - Interface for FlatMap event handlers
 * Defines the contract for composable event handlers
 */
export interface IFlatMapEventHandler {
  /**
   * Initialize the event handler with a reference to the parent FlatMap
   * @param flatMap - The parent FlatMap instance
   */
  init(flatMap: IFlatMap): void;

  /**
   * Attach the event handler to the map
   */
  attach(): void;

  /**
   * Detach the event handler from the map
   */
  detach(): void;

  /**
   * Clean up resources
   */
  dispose(): void;
}
