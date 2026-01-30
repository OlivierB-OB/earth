import L from "leaflet";
import { CONFIG } from "../../config";
import type { IFlatMap } from "./IFlatMap";
import type { IFlatMapLayer } from "./IFlatMapLayer";
import type { IFlatMapEventHandler } from "./IFlatMapEventHandler";

/**
 * FlatMap - Facade wrapper around Leaflet map instance
 * Encapsulates all Leaflet-specific logic and lifecycle management
 * Manages composable layers using IoC pattern
 */
export class FlatMap implements IFlatMap {
  private _map: L.Map | null = null;
  private layers: Set<IFlatMapLayer> = new Set();
  private eventHandlers: Set<IFlatMapEventHandler> = new Set();

  get map(): L.Map | null {
    return this._map;
  }

  /**
   * Initialize the map with a DOM reference
   * @param domRef - DOM container for the map
   * @param onMapClick - Callback for map click events
   */
  init(domRef: HTMLElement): void {
    if (!domRef) {
      throw new Error("FlatMap.init requires a valid DOM reference");
    }

    // Initialize map
    this._map = L.map(domRef).setView([0, 0], CONFIG.MAP.INITIAL_ZOOM);

    this.render();

    // Attach all event handlers
    for (const eventHandler of this.eventHandlers.values()) {
      eventHandler.attach();
    }
  }

  /**
   * Pan map to a specific location
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   */
  panTo(latitude: number, longitude: number): void {
    if (this._map) {
      this._map.panTo([latitude, longitude]);
    }
  }

  /**
   * Add a layer to the map
   * Initializes and renders the layer
   * @param layer - Layer instance to add
   * @throws Error if layer is already added or map not initialized
   */
  addLayer(layer: IFlatMapLayer): void {
    if (this.layers.has(layer)) {
      throw new Error(`Layer already exists`);
    }

    // Store reference to the layer
    this.layers.add(layer);

    // Initialize the layer with this FlatMap instance (IoC)
    layer.init(this);

    if (this._map) {
      // Render the layer
      layer.render();
    }
  }

  /**
   * Remove a layer from the map
   * Disposes of the layer's resources
   * @param layerName - Name of the layer to remove
   * @throws Error if layer does not exist
   */
  removeLayer(layer: IFlatMapLayer): void {
    if (!this.layers.has(layer)) {
      throw new Error(`Layer does not exist`);
    }

    // Clean up the layer's resources
    layer.dispose();

    // Remove from tracking
    this.layers.delete(layer);
  }

  /**
   * Add an event handler to the map
   * Initializes and attaches the event handler
   * @param eventHandler - Event handler instance to add
   * @throws Error if event handler is already added or map not initialized
   */
  addEventHandler(eventHandler: IFlatMapEventHandler): void {
    if (this.eventHandlers.has(eventHandler)) {
      throw new Error(`Event handler already exists`);
    }

    // Store reference to the event handler
    this.eventHandlers.add(eventHandler);

    // Initialize the event handler with this FlatMap instance (IoC)
    eventHandler.init(this);

    if (this._map) {
      // Attach the event handler
      eventHandler.attach();
    }
  }

  /**
   * Remove an event handler from the map
   * Detaches and disposes of the event handler's resources
   * @param eventHandler - Event handler instance to remove
   * @throws Error if event handler does not exist
   */
  removeEventHandler(eventHandler: IFlatMapEventHandler): void {
    if (!this.eventHandlers.has(eventHandler)) {
      throw new Error(`Event handler does not exist`);
    }

    // Clean up the event handler's resources
    eventHandler.dispose();

    // Remove from tracking
    this.eventHandlers.delete(eventHandler);
  }

  /**
   * Rerender all layers
   * Called when the map needs to refresh all layers
   */
  render(): void {
    for (const layer of this.layers.values()) {
      layer.render();
    }
  }

  /**
   * Clean up resources and remove the map instance
   */
  dispose(): void {
    // Dispose all event handlers
    for (const eventHandler of this.eventHandlers.values()) {
      eventHandler.dispose();
    }
    this.eventHandlers.clear();

    // Dispose all layers
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();

    // Remove the Leaflet map instance
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }
}
