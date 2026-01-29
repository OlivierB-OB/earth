import L from "leaflet";
import type { IFlatMap } from "./IFlatMap";
import type { IFlatMapLayer } from "./IFlatMapLayer";

/**
 * FlatMapLayer - Abstract base class for FlatMap layers
 * Provides lifecycle management and rendering interface for composable map layers
 */
export abstract class FlatMapLayer<T extends L.Layer> implements IFlatMapLayer {
  rerender(): void {
    throw new Error("Method not implemented.");
  }
  protected flatMap: IFlatMap | null = null;
  protected layer: T | null = null;

  /**
   * Initialize the layer with a reference to the parent FlatMap
   * Override in subclasses to set up initial state and resources
   * @param flatMap - The parent FlatMap instance
   */
  init(flatMap: IFlatMap): void {
    this.flatMap = flatMap;
  }

  /**
   * Render the layer on the map
   */
  render(): void {
    if (this.layer) {
      this.layer.remove();
    }

    if (!this.flatMap?.map) {
      throw new Error("FlatMap not initialized");
    }

    this.layer = this.renderLayer();
    this.layer.addTo(this.flatMap.map);
  }

  protected abstract renderLayer(): T;

  /**
   * Refresh the layer if the map has been initialized
   * Only proceeds with re-rendering if the map is ready
   */
  refresh(): void {
    if (this.flatMap?.map) {
      this.render();
    }
  }

  /**
   * Clean up resources
   * Override in subclasses to remove elements and clean up references
   */
  dispose(): void {
    this.flatMap = null;
    this.layer = null;
  }
}
