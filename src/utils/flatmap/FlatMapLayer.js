import L from "leaflet";

/**
 * FlatMapLayer - Abstract base class for FlatMap layers
 * Provides lifecycle management and rendering interface for composable map layers
 */
export class FlatMapLayer {
  constructor(name = "UnnamedLayer") {
    this.name = name;
    this.isInitialized = false;
  }

  /**
   * Initialize the layer with a reference to the parent FlatMap
   * Override in subclasses to set up initial state and resources
   * @param {FlatMap} flatMap - The parent FlatMap instance
   */
  init(flatMap) {
    this.flatMap = flatMap;
    this.isInitialized = true;
  }

  /**
   * Render the layer on the map
   * Override in subclasses to add elements to the map
   */
  render() {
    if (!this.isInitialized) {
      throw new Error(
        `Layer "${this.name}" must be initialized before rendering`,
      );
    }
  }

  /**
   * Re-render the layer
   * Called when the parent FlatMap is re-rendered
   * Override in subclasses for custom re-render logic
   */
  rerender() {
    // Default implementation: dispose and re-render
    this.dispose();
    this.render();
  }

  /**
   * Clean up resources
   * Override in subclasses to remove elements and clean up references
   */
  dispose() {
    this.isInitialized = false;
    this.flatMap = null;
  }
}
