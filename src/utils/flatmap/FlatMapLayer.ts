import type { FlatMap } from "./FlatMap";

/**
 * FlatMapLayer - Abstract base class for FlatMap layers
 * Provides lifecycle management and rendering interface for composable map layers
 */
export abstract class FlatMapLayer {
  name: string;
  isInitialized: boolean = false;
  protected flatMap: FlatMap | null = null;

  constructor(name: string = "UnnamedLayer") {
    this.name = name;
  }

  /**
   * Initialize the layer with a reference to the parent FlatMap
   * Override in subclasses to set up initial state and resources
   * @param flatMap - The parent FlatMap instance
   */
  init(flatMap: FlatMap): void {
    this.flatMap = flatMap;
    this.isInitialized = true;
  }

  /**
   * Render the layer on the map
   * Override in subclasses to add elements to the map
   */
  render(): void {
    if (!this.isInitialized) {
      throw new Error(
        `Layer "${this.name}" must be initialized before rendering`
      );
    }
  }

  /**
   * Re-render the layer
   * Called when the parent FlatMap is re-rendered
   * Override in subclasses for custom re-render logic
   */
  rerender(): void {
    // Default implementation: dispose and re-render
    this.dispose();
    this.render();
  }

  /**
   * Clean up resources
   * Override in subclasses to remove elements and clean up references
   */
  dispose(): void {
    this.isInitialized = false;
    this.flatMap = null;
  }
}
