import React, { ReactElement } from "react";
import { LocationProvider } from "./context/LocationContext";
import EarthViewer from "./components/EarthViewer";
import MapCard from "./components/mapCard/MapCard";
import Card from "./components/Card";

/**
 * App Component
 *
 * Root component that renders the Earth visualization application.
 * Wraps all child components with LocationProvider to enable shared state management
 * and bidirectional synchronization between EarthViewer and MapCard.
 *
 * Layout: EarthViewer fills the full viewport, with MapCard positioned as a fixed overlay.
 */
function App(): ReactElement {
  return (
    <LocationProvider>
      <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0 }}>
        <EarthViewer />
        <Card>
          <MapCard />
        </Card>
      </div>
    </LocationProvider>
  );
}

export default App;
