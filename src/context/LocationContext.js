import React, { createContext, useState, useCallback } from 'react';

export const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocation] = useState({
    latitude: 0,
    longitude: 0,
  });

  const setFocusedLocation = useCallback((latitude, longitude) => {
    setLocation({
      latitude: Math.max(-90, Math.min(90, latitude)),
      longitude: ((longitude + 180) % 360) - 180,
    });
  }, []);

  const value = {
    location,
    setFocusedLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = React.useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
