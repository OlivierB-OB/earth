import L from 'leaflet';
import type { FlatMapLayer } from './FlatMapLayer';

/**
 * FlatMap - Facade wrapper around Leaflet map instance
 * Encapsulates all Leaflet-specific logic and lifecycle management
 * Manages composable layers using IoC pattern
 */
export class FlatMap {
  private _map: L.Map | null = null;
  private marker: L.CircleMarker<any> | null = null;
  private onClickCallback: ((lat: number, lng: number) => void) | null = null;
  private layers: Map<string, FlatMapLayer> = new Map();

  get map(): L.Map | null {
    return this._map;
  }

  /**
   * Initialize the map with a DOM reference
   * @param domRef - DOM container for the map
   * @param onMapClick - Callback for map click events
   */
  init(domRef: HTMLElement, onMapClick?: (lat: number, lng: number) => void): void {
    if (!domRef) {
      throw new Error('FlatMap.init requires a valid DOM reference');
    }

    // Initialize map
    this._map = L.map(domRef).setView([0, 0], 2);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this._map);

    // Store callback and attach event listener
    this.onClickCallback = onMapClick ?? null;
    if (onMapClick && this._map) {
      this._map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onMapClick(lat, lng);
      });
    }
  }

  /**
   * Update marker position on the map
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   */
  updateMarker(latitude: number, longitude: number): void {
    if (!this._map) return;

    // Remove existing marker if it exists
    if (this.marker) {
      this.marker.remove();
    }

    // Create new marker
    this.marker = L.circleMarker([latitude, longitude], {
      radius: 8,
      fillColor: '#ff0000',
      color: '#ff0000',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.6,
    }).addTo(this._map);
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
  addLayer(layer: FlatMapLayer): void {
    if (!this._map) {
      throw new Error('FlatMap must be initialized before adding layers');
    }

    if (this.layers.has(layer.name)) {
      throw new Error(`Layer with name "${layer.name}" already exists`);
    }

    // Initialize the layer with this FlatMap instance (IoC)
    layer.init(this);

    // Render the layer
    layer.render();

    // Store reference to the layer
    this.layers.set(layer.name, layer);
  }

  /**
   * Remove a layer from the map
   * Disposes of the layer's resources
   * @param layerName - Name of the layer to remove
   * @throws Error if layer does not exist
   */
  removeLayer(layerName: string): void {
    const layer = this.layers.get(layerName);

    if (!layer) {
      throw new Error(`Layer with name "${layerName}" does not exist`);
    }

    // Clean up the layer's resources
    layer.dispose();

    // Remove from tracking
    this.layers.delete(layerName);
  }

  /**
   * Get a layer by name
   * @param layerName - Name of the layer
   * @returns The layer instance or undefined if not found
   */
  getLayer(layerName: string): FlatMapLayer | undefined {
    return this.layers.get(layerName);
  }

  /**
   * Rerender all layers
   * Called when the map needs to refresh all layers
   */
  rerenderLayers(): void {
    for (const layer of this.layers.values()) {
      layer.rerender();
    }
  }

  /**
   * Clean up resources and remove the map instance
   */
  dispose(): void {
    // Dispose all layers first
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();

    if (this._map) {
      // Remove event listeners
      if (this.onClickCallback) {
        this._map.off('click');
      }

      // Remove marker
      if (this.marker) {
        this.marker.remove();
      }

      // Destroy the map
      this._map.remove();
      this._map = null;
      this.marker = null;
      this.onClickCallback = null;
    }
  }
}
