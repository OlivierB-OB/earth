import type { IFlatMap } from "./IFlatMap";

/**
 * IFlatMapLayer - Interface for FlatMap layers
 * Defines the contract for composable map layers
 */
export interface IFlatMapLayer {
  /**
   * Initialize the layer with a reference to the parent FlatMap
   * @param flatMap - The parent FlatMap instance
   */
  init(flatMap: IFlatMap): void;

  /**
   * Render the layer on the map
   */
  render(): void;

  /**
   * Clean up resources
   */
  dispose(): void;
}
