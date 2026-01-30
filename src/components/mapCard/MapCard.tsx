import { useEffect, useRef, ReactElement } from "react";
import "leaflet/dist/leaflet.css";
import { useLocation } from "../../context/LocationContext";
import { BaseMapLayer, FlatMap } from "../../utils/flatmap";
import { ClickEventHandler } from "./utils/ClickEventHandler";
import { FlatMapMarkerLayer } from "./utils/FlatMapMarkerLayer";

/**
 * MapCard Component
 *
 * Renders a fixed-position card (bottom-right) containing an interactive 2D Leaflet map
 * with the following features:
 * - OpenStreetMap tiles via BaseMapLayer
 * - Red circle marker showing the currently focused location
 * - Click-to-focus: Clicking the map sets the focused location via LocationContext
 * - Pan synchronization: Map automatically pans when location changes from EarthViewer
 * - Bidirectional sync: Map clicks and external location changes keep views aligned
 *
 * The component manages two React effects:
 * 1. Initialization: Creates FlatMap instance with layers and event handlers
 * 2. Location updates: Pans map and repositions marker when location context changes
 */
const MapCard = (): ReactElement => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<FlatMap | null>(null);
  const marker = useRef<FlatMapMarkerLayer | null>(null);
  const { location, setFocusedLocation } = useLocation();

  /**
   * Initialize the FlatMap instance with layers and event handlers.
   * Adds BaseMapLayer (OpenStreetMap tiles) and FlatMapMarkerLayer (red focus marker).
   * Attaches ClickEventHandler to update location when user clicks the map.
   * Initializes marker position with current location from context.
   * Cleanup disposes all map resources on unmount.
   */
  useEffect(() => {
    if (!mapContainerRef.current) return;

    map.current = new FlatMap();
    marker.current = new FlatMapMarkerLayer();
    map.current.addLayer(new BaseMapLayer());
    map.current.addEventHandler(new ClickEventHandler(setFocusedLocation));
    map.current.addLayer(marker.current);
    map.current.init(mapContainerRef.current);

    marker.current.setPosition(location.latitude, location.longitude);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.dispose();
        map.current = null;
      }
    };
  }, [setFocusedLocation, location.latitude, location.longitude]);

  /**
   * Update marker position and pan map when location context changes.
   * Called when user interacts with EarthViewer or when external location updates occur.
   */
  useEffect(() => {
    if (map.current && marker.current && location) {
      marker.current.setPosition(location.latitude, location.longitude);
      map.current.panTo(location.latitude, location.longitude);
    }
  }, [location, location.latitude, location.longitude]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
};

export default MapCard;
