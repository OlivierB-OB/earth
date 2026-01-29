import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '../context/LocationContext';

const MapCard = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const { location, setFocusedLocation } = useLocation();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView([0, 0], 2);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Create marker for focused location
    const marker = L.circleMarker([location.latitude, location.longitude], {
      radius: 8,
      fillColor: '#ff0000',
      color: '#ff0000',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.6,
    }).addTo(map);

    markerRef.current = marker;

    // Handle map clicks
    const onMapClick = (e) => {
      const { lat, lng } = e.latlng;
      setFocusedLocation(lat, lng);
    };

    map.on('click', onMapClick);

    // Cleanup
    return () => {
      map.off('click', onMapClick);
      map.remove();
    };
  }, [location.latitude, location.longitude, setFocusedLocation]);

  // Update marker position when location changes
  useEffect(() => {
    if (markerRef.current && location) {
      markerRef.current.setLatLng([location.latitude, location.longitude]);
      if (mapRef.current) {
        mapRef.current.panTo([location.latitude, location.longitude]);
      }
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
