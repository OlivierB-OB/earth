import React, { ReactElement } from "react";
import { DroneProvider } from "./context/DroneContext";
import EarthViewer from "./components/EarthViewer";
import MapCard from "./components/MapCard";
import Card from "./components/Card";

/**
 * App Component
 *
 * Root component that renders the drone flight simulator application.
 * Wraps all child components with DroneProvider to enable shared state management
 * and bidirectional synchronization between EarthViewer (3D drone view) and MapCard (2D minimap).
 *
 * Layout: EarthViewer fills the full viewport, with MapCard positioned as a fixed overlay minimap.
 */
function App(): ReactElement {
  return (
    <DroneProvider>
      <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0 }}>
        <EarthViewer />
        <Card>
          <MapCard />
        </Card>
      </div>
    </DroneProvider>
  );
}

export default App;
