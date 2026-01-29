import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '../context/LocationContext';
import { FlatMap } from '../utils/FlatMap';

const MapCard = () => {
  const mapContainerRef = useRef(null);
  const flatMapRef = useRef(null);
  const { location, setFocusedLocation } = useLocation();

  // Initialize the FlatMap instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    flatMapRef.current = new FlatMap();
    flatMapRef.current.init(mapContainerRef.current, (lat, lng) => {
      setFocusedLocation(lat, lng);
    });

    flatMapRef.current.updateMarker(location.latitude, location.longitude);

    // Cleanup
    return () => {
      if (flatMapRef.current) {
        flatMapRef.current.dispose();
        flatMapRef.current = null;
      }
    };
  }, [setFocusedLocation]);

  // Update marker position when location changes
  useEffect(() => {
    if (flatMapRef.current && location) {
      flatMapRef.current.updateMarker(location.latitude, location.longitude);
      flatMapRef.current.panTo(location.latitude, location.longitude);
    }
  }, [location]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};

export default MapCard;
