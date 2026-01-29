import { useEffect, useRef, ReactElement } from "react";
import "leaflet/dist/leaflet.css";
import { useLocation } from "../../context/LocationContext";
import { BaseMapLayer, FlatMap } from "../../utils/flatmap";
import { ClickEventHandler } from "./utils/ClickEventHandler";
import { FlatMapMarkerLayer } from "./utils/FlatMapMarkerLayer";

const MapCard = (): ReactElement => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<FlatMap | null>(null);
  const marker = useRef<FlatMapMarkerLayer | null>(null);
  const { location, setFocusedLocation } = useLocation();

  // Initialize the FlatMap instance
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

  // Update marker position when location changes
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
