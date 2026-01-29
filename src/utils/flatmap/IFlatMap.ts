import type L from "leaflet";
import type { IFlatMapLayer } from "./IFlatMapLayer";

/**
 * IFlatMap - Interface for Leaflet map facade
 * Defines the contract for the FlatMap wrapper
 */
export interface IFlatMap {
  readonly map: L.Map | null;

  /**
   * Initialize the map with a DOM reference
   * @param domRef - DOM container for the map
   * @param onMapClick - Callback for map click events
   */
  init(
    domRef: HTMLElement,
    onMapClick?: (lat: number, lng: number) => void
  ): void;

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
   * Rerender all layers
   */
  render(): void;

  /**
   * Clean up resources and remove the map instance
   */
  dispose(): void;
}
