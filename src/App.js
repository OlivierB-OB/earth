import React from 'react';
import EarthViewer from './components/EarthViewer';
import MapCard from './components/MapCard';
import Card from './components/Card';

function App() {
  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      <EarthViewer />
      <Card>
        <MapCard />
      </Card>
    </div>
  );
}

export default App;
