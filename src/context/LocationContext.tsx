import React, { createContext, useState, useCallback, ReactNode } from "react";
import type { Location, LocationContextType } from "../types";

export const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({
  children,
}: LocationProviderProps): React.ReactElement {
  const [location, setLocation] = useState<Location>({
    latitude: 0,
    longitude: 0,
  });

  const setFocusedLocation = useCallback(
    (latitude: number, longitude: number) => {
      setLocation({
        latitude: Math.max(-90, Math.min(90, latitude)),
        longitude: ((longitude + 180) % 360) - 180,
      });
    },
    []
  );

  const value: LocationContextType = {
    location,
    setFocusedLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextType {
  const context = React.useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
}
