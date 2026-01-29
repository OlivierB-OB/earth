import L from "leaflet";

/**
 * FlatMap - Facade wrapper around Leaflet map instance
 * Encapsulates all Leaflet-specific logic and lifecycle management
 * Manages composable layers using IoC pattern
 */
export class FlatMap {
  constructor() {
    this.map = null;
    this.marker = null;
    this.onClickCallback = null;
    this.layers = new Map(); // Map of layerName -> FlatMapLayer instance
  }

  /**
   * Initialize the map with a DOM reference
   * @param {HTMLElement} domRef - DOM container for the map
   * @param {Function} onMapClick - Callback for map click events
   */
  init(domRef, onMapClick) {
    if (!domRef) {
      throw new Error("FlatMap.init requires a valid DOM reference");
    }

    // Initialize map
    this.map = L.map(domRef).setView([0, 0], 2);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(this.map);

    // Store callback and attach event listener
    this.onClickCallback = onMapClick;
    if (onMapClick) {
      this.map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        onMapClick(lat, lng);
      });
    }
  }

  /**
   * Update marker position on the map
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   */
  updateMarker(latitude, longitude) {
    if (!this.map) return;

    // Remove existing marker if it exists
    if (this.marker) {
      this.marker.remove();
    }

    // Create new marker
    this.marker = L.circleMarker([latitude, longitude], {
      radius: 8,
      fillColor: "#ff0000",
      color: "#ff0000",
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.6,
    }).addTo(this.map);
  }

  /**
   * Pan map to a specific location
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   */
  panTo(latitude, longitude) {
    if (this.map) {
      this.map.panTo([latitude, longitude]);
    }
  }

  /**
   * Add a layer to the map
   * Initializes and renders the layer
   * @param {FlatMapLayer} layer - Layer instance to add
   * @throws {Error} If layer is already added or map not initialized
   */
  addLayer(layer) {
    if (!this.map) {
      throw new Error("FlatMap must be initialized before adding layers");
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
   * @param {string} layerName - Name of the layer to remove
   * @throws {Error} If layer does not exist
   */
  removeLayer(layerName) {
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
   * @param {string} layerName - Name of the layer
   * @returns {FlatMapLayer|undefined} The layer instance or undefined if not found
   */
  getLayer(layerName) {
    return this.layers.get(layerName);
  }

  /**
   * Rerender all layers
   * Called when the map needs to refresh all layers
   */
  rerenderLayers() {
    for (const layer of this.layers.values()) {
      layer.rerender();
    }
  }

  /**
   * Clean up resources and remove the map instance
   */
  dispose() {
    // Dispose all layers first
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();

    if (this.map) {
      // Remove event listeners
      if (this.onClickCallback) {
        this.map.off("click");
      }

      // Remove marker
      if (this.marker) {
        this.marker.remove();
      }

      // Destroy the map
      this.map.remove();
      this.map = null;
      this.marker = null;
      this.onClickCallback = null;
    }
  }
}
