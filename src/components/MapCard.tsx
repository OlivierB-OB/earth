import { useEffect, useRef, ReactElement } from "react";
import "leaflet/dist/leaflet.css";
import { useDrone } from "../context/DroneContext";
import {
  BaseMapLayer,
  FlatMap,
  FlatMapMarkerLayer,
  ClickEventHandler,
} from "../utils/flatmap";

/**
 * MapCard Component
 *
 * Renders a fixed-position card (bottom-right) containing an interactive 2D Leaflet map
 * (acts as a minimap for the drone simulator) with the following features:
 * - OpenStreetMap tiles via BaseMapLayer
 * - Red circle marker showing the drone's current position
 * - Click-to-navigate: Clicking the map commands the drone to fly to that location
 * - Pan synchronization: Map automatically pans when drone position changes
 * - Bidirectional sync: Map clicks and drone movement keep views aligned
 *
 * The component manages two React effects:
 * 1. Initialization: Creates FlatMap instance with layers and event handlers
 * 2. Drone position updates: Pans map and repositions marker when drone moves
 */
const MapCard = (): ReactElement => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<FlatMap | null>(null);
  const marker = useRef<FlatMapMarkerLayer | null>(null);
  const { drone, setDronePosition } = useDrone();

  /**
   * Initialize the FlatMap instance with layers and event handlers.
   * Adds BaseMapLayer (OpenStreetMap tiles) and FlatMapMarkerLayer (red marker for drone).
   * Attaches ClickEventHandler to navigate drone to clicked location.
   * Initializes marker position with current drone position from context.
   * Cleanup disposes all map resources on unmount.
   */
  useEffect(() => {
    if (!mapContainerRef.current) return;

    map.current = new FlatMap();
    marker.current = new FlatMapMarkerLayer();
    map.current.addLayer(new BaseMapLayer());
    map.current.addEventHandler(
      new ClickEventHandler((lat, lng) => {
        // Navigate drone to clicked location, keeping current elevation
        setDronePosition({
          latitude: lat,
          longitude: lng,
          elevation: drone.elevation,
        });
      })
    );
    map.current.addLayer(marker.current);
    map.current.init(mapContainerRef.current);

    marker.current.setPosition(drone.latitude, drone.longitude);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.dispose();
        map.current = null;
      }
    };
  }, [drone.elevation, drone.latitude, drone.longitude, setDronePosition]);

  /**
   * Update marker position and pan map when drone position changes.
   * Called when user controls drone or when external position updates occur.
   */
  useEffect(() => {
    if (map.current && marker.current) {
      marker.current.setPosition(drone.latitude, drone.longitude);
      map.current.panTo(drone.latitude, drone.longitude);
    }
  }, [drone]);

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
