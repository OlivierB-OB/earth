import type L from "leaflet";
import type { IFlatMapLayer } from "./IFlatMapLayer";
import type { IFlatMapEventHandler } from "./IFlatMapEventHandler";

/**
 * IFlatMap - Interface for Leaflet map facade
 * Defines the contract for the FlatMap wrapper
 */
export interface IFlatMap {
  readonly map: L.Map | null;

  /**
   * Initialize the map with a DOM reference
   * @param domRef - DOM container for the map
   */
  init(domRef: HTMLElement): void;

  /**
   * Pan map to a specific location
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   */
  panTo(latitude: number, longitude: number): void;

  /**
   * Add a layer to the map
   * @param layer - Layer instance to add
   */
  addLayer(layer: IFlatMapLayer): void;

  /**
   * Remove a layer from the map
   * @param layer - Layer instance to remove
   */
  removeLayer(layer: IFlatMapLayer): void;

  /**
   * Add an event handler to the map
   * @param eventHandler - Event handler instance to add
   */
  addEventHandler(eventHandler: IFlatMapEventHandler): void;

  /**
   * Remove an event handler from the map
   * @param eventHandler - Event handler instance to remove
   */
  removeEventHandler(eventHandler: IFlatMapEventHandler): void;

  /**
   * Render all layers on the map
   */
  render(): void;

  /**
   * Clean up resources and remove the map instance
   */
  dispose(): void;
}
