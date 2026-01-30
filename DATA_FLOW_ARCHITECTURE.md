# Data Flow Architecture: Generation → Events → Subscription → Rendering

This document explains the complete flow of how items are created in the DataManager, published via events, subscribed by layers, and rendered in the 3D viewer.

## Table of Contents

1. [Overview](#overview)
2. [DataManager: Generation & Events](#datamanager-generation--events)
3. [Event System: Subscription Pattern](#event-system-subscription-pattern)
4. [Layer Rendering: TerrainLayer & ContextLayer](#layer-rendering-terrainlayer--contextlayer)
5. [State Management: DroneContext & DroneController](#state-management-dronecontext--dronecontroller)
6. [Complete Lifecycle: Step-by-Step Flow](#complete-lifecycle-step-by-step-flow)
7. [Coordinate Systems: Geographic → World → Three.js](#coordinate-systems-geographic--world--threeJs)
8. [Memory & Performance Optimization](#memory--performance-optimization)

---

## Overview

The architecture follows a **data generation → event publishing → subscription → rendering** pattern:

```
DroneController updates position
    ↓
DataManager emits events
    ↓
Layers subscribe to events
    ↓
Layers create Three.js meshes
    ↓
Renderer displays scene
```

**Key insight**: Layers don't pull data; they receive notifications via events. This decouples data generation from rendering logic.

---

## DataManager: Generation & Events

**File**: `src/utils/dataManager/DataManager.ts`

### Core Responsibilities

- Divides world into **1000m × 1000m blocks**
- Loads blocks within **2000m radius** of drone
- Unloads blocks beyond **2500m** (memory management)
- Emits `"load"` and `"unload"` events to subscribers

### Event System

```typescript
// Subscription API
public onDataChange(listener: DataChangeListener): () => void {
  this.listeners.add(listener);
  return () => this.listeners.delete(listener);  // Unsubscribe function
}

// Event emission (internal)
private emitDataChange(event: DataChangeEvent): void {
  this.listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error("Error in data change listener:", error);
    }
  });
}
```

### Block Lifecycle

1. **Trigger**: `updateDronePosition(latitude, longitude)` called from EarthViewer update loop
2. **Calculation**: Compute which blocks are within load radius
3. **Generation**: New blocks generated via `MockDataGenerator`
4. **Event emission**: Emit `{ type: "load", blocks: [...] }` for new blocks
5. **Cleanup**: Unload distant blocks, emit `{ type: "unload", blocks: [...] }`

### Data Structure (DataBlock)

```typescript
interface DataBlock {
  id: string;                  // e.g., "block_0_0"
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  elevation: HeightfieldData;  // 32x32 grid of elevation values
  items: ContextualItem[];     // Buildings, trees, landmarks
  loadedAt: number;            // Timestamp
}
```

---

## MockDataGenerator: Procedural Generation with Seeding

**File**: `src/utils/dataManager/MockDataGenerator.ts`

### Terrain Generation (Elevation)

Uses **multi-octave Perlin-like noise** via sine/cosine combinations:

```typescript
private perlinLike(lat, lng, blockLat, blockLng): number {
  // Base elevation varies by region
  const baseElevation =
    CONFIG.TERRAIN.BASE_ELEVATION_OFFSET +
    Math.sin(blockLat * FREQ) * AMP +
    Math.cos(blockLng * FREQ) * AMP;

  // Large hills
  const hills1 = Math.sin(lat * FREQ) * Math.cos(lng * FREQ) * AMP;

  // Medium features (5Hz frequency)
  const features = Math.sin(lat * FREQ) * Math.cos(lng * FREQ) * AMP;

  // Fine details (13-11Hz frequency)
  const details = Math.sin(lat * FINE_FREQ) * Math.cos(lng * FINE_FREQ) * AMP;

  return baseElevation + hills1 + features + details;  // [0, 500] meters
}
```

**Grid Resolution**: 32×32 vertices per block (1000m ÷ 32 ≈ 31m per vertex)

### Contextual Item Generation (Buildings, Trees, Landmarks)

**Seeded randomization** ensures **deterministic generation**:

```typescript
// Hash coordinates to create deterministic seed
private hashCoordinates(lat: number, lng: number): number {
  const latInt = Math.floor(lat * 1000);
  const lngInt = Math.floor(lng * 1000);
  let hash = 5381;
  hash = (hash << 5) + hash + latInt;
  hash = (hash << 5) + hash + lngInt;
  return Math.abs(hash);
}

// Use seed for deterministic randomization
private seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);  // Returns [0, 1)
}
```

### Generation Process

1. Compute hash from block coordinates
2. Generate 5–15 items per block (seeded count)
3. For each item:
   - **Position**: Seeded random lat/lng within block bounds
   - **Type**: 10% landmark, 30% building, 60% tree
   - **Height**: Type-specific ranges + seeded variation
   - **Dimensions**: Width/depth seeded randomization

### Item Types

| Type | Height | Color | Geometry |
|------|--------|-------|----------|
| **Landmark** | 30–70m | Gold | Box (15m × h × 15m) |
| **Building** | 10–30m | Gray | Box (5m × h × 5m) |
| **Tree** | 15–35m | Green | Cylinder (trunk) + Cone (foliage) |

### Example: Deterministic Generation

```
Block (0, 0) always generates:
- item_0_0_0: Tree at lat=0.002, lng=0.001, height=22.5m
- item_0_0_1: Building at lat=-0.001, lng=0.003, height=18.2m
- item_0_0_2: Landmark at lat=0.005, lng=-0.002, height=45.0m
```

Same block ID = same items, always.

---

## Event System: Subscription Pattern

**Type Definition** (`src/types/DataManager.ts`):

```typescript
export interface DataChangeEvent {
  type: "load" | "unload" | "update";
  blocks: DataBlock[];
}

export type DataChangeListener = (event: DataChangeEvent) => void;
```

### Subscription Flow

**Critical**: Layers must subscribe BEFORE data is loaded.

```typescript
// EarthViewer.tsx - initialization order (lines 57-74)
const terrainLayer = new Viewer3DTerrainLayer(dataManager);
scene.addItem(terrainLayer);  // Add layer first

const contextLayer = new Viewer3DContextLayer(dataManager);
scene.addItem(contextLayer);

viewer.init(containerRef.current);  // Initialize scene → layers subscribe here

dataManager.updateDronePosition(...);  // THEN load data → triggers events
```

**Why this order matters**:
1. Layers added to scene before `viewer.init()`
2. `viewer.init()` calls `render()` on each layer
3. Layers `render()` calls `makeObject()` which sets up subscriptions
4. Only AFTER subscriptions ready do we load data via `updateDronePosition()`

---

## Layer Rendering: TerrainLayer & ContextLayer

### TerrainLayer (`src/utils/3dviewer/Viewer3DTerrainLayer.ts`)

#### Initialization & Subscription

```typescript
protected makeObject(): Group {
  const group = new Group();

  // Subscribe to data manager changes
  this.unsubscribeFromDataManager = this.dataManager.onDataChange((event) => {
    this.handleDataChange(event);
  });

  return group;
}
```

#### Event Handling

```typescript
private handleDataChange(event: DataChangeEvent): void {
  if (event.type === "load") {
    event.blocks.forEach((block) => {
      this.addTerrainMesh(block);
    });
    this.scene.viewer.renderer.markDirty();  // Request render
  } else if (event.type === "unload") {
    event.blocks.forEach((block) => {
      this.removeTerrainMesh(block.id);
    });
    this.scene.viewer.renderer.markDirty();
  }
}
```

#### Mesh Creation

```typescript
private addTerrainMesh(block: DataBlock): void {
  // 1. Calculate block offset from drone (using Mercator projection)
  const [blockMercX, blockMercY] = MercatorConverter.latLngToMeters(
    blockCenterLat, blockCenterLng
  );
  const [droneMercX, droneMercY] = MercatorConverter.latLngToMeters(
    this.droneLat, this.droneLng
  );
  const offsetX = blockMercX - droneMercX;
  const offsetZ = blockMercY - droneMercY;

  // 2. Create BufferGeometry from elevation grid
  const geometry = this.createTerrainGeometry(block);

  // 3. Create mesh with material
  const material = new MeshPhongMaterial({
    color: new Color(0.2, 0.6, 0.2),  // Green
    flatShading: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(offsetX, 0, offsetZ);

  // 4. Add to scene
  this.terrainMeshes.set(block.id, mesh);
  this.object.add(mesh);
}
```

#### Geometry Creation (32×32 Grid → 1922 Triangles)

```typescript
private createTerrainGeometry(block: DataBlock): BufferGeometry {
  const { elevation, bounds } = block;
  const { width, height, data } = elevation;  // 32x32 grid

  const positions: number[] = [];
  const indices: number[] = [];

  // Generate vertices
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const index = row * width + col;
      const elev = data[index];

      // Normalize to [0, 1], convert to lat/lng, then to Mercator
      const x = col / (width - 1);
      const y = row / (height - 1);
      const lat = bounds.south + y * (bounds.north - bounds.south);
      const lng = bounds.west + x * (bounds.east - bounds.west);

      const [mercX, mercY] = MercatorConverter.latLngToMeters(lat, lng);
      const [blockCenterMercX, blockCenterMercY] =
        MercatorConverter.latLngToMeters(blockCenterLat, blockCenterLng);

      positions.push(
        mercX - blockCenterMercX,  // X: relative to block center
        elev,                       // Y: elevation
        mercY - blockCenterMercY    // Z: relative to block center
      );
    }
  }

  // Generate triangle indices (two triangles per grid cell)
  for (let row = 0; row < height - 1; row++) {
    for (let col = 0; col < width - 1; col++) {
      const a = row * width + col;
      const b = a + 1;
      const c = a + width;
      const d = c + 1;
      indices.push(a, c, b);  // First triangle
      indices.push(b, c, d);  // Second triangle
    }
  }

  // Create geometry with vertex normals for lighting
  const geometry = new BufferGeometry();
  geometry.setAttribute("position",
    new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(new BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();

  return geometry;
}
```

#### Cleanup

```typescript
private removeTerrainMesh(blockId: string): void {
  const mesh = this.terrainMeshes.get(blockId);
  if (mesh) {
    this.object.remove(mesh);
    // Dispose Three.js resources
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material instanceof MeshPhongMaterial) mesh.material.dispose();
    this.terrainMeshes.delete(blockId);
  }
}
```

### ContextLayer (`src/utils/3dviewer/Viewer3DContextLayer.ts`)

**Nearly identical subscription pattern**, but creates 3D objects for buildings, trees, and landmarks.

#### Event Handling & Item Mesh Creation

```typescript
private handleDataChange(event: DataChangeEvent): void {
  if (event.type === "load") {
    event.blocks.forEach((block) => {
      block.items.forEach((item) => {
        this.addItemMesh(item, block);
      });
    });
    this.scene.viewer.renderer.markDirty();
  } else if (event.type === "unload") {
    event.blocks.forEach((block) => {
      block.items.forEach((item) => {
        this.removeItemMesh(item.id);
      });
    });
    this.scene.viewer.renderer.markDirty();
  }
}
```

#### Mesh Generation by Type

```typescript
private createItemMesh(item: ContextualItem, block: DataBlock): Object3D | null {
  let geometry;
  let color;

  switch (item.type) {
    case "building": {
      geometry = new BoxGeometry(
        item.width || CONFIG.PROCEDURAL_OBJECTS.BUILDING_WIDTH,
        item.height || CONFIG.PROCEDURAL_OBJECTS.BUILDING_HEIGHT,
        item.depth || CONFIG.PROCEDURAL_OBJECTS.BUILDING_DEPTH
      );
      color = new Color(0.7, 0.7, 0.7);  // Gray
      break;
    }

    case "tree": {
      // Trees are composite objects (trunk + foliage)
      const group = new Group();

      // Trunk: Cylinder
      const trunk = new Mesh(
        new CylinderGeometry(0.5, 0.8, item.height * 0.3, 8),
        new MeshPhongMaterial({ color: new Color(0.4, 0.2, 0) })
      );
      group.add(trunk);

      // Foliage: Cone
      const foliage = new Mesh(
        new ConeGeometry(5, item.height * 0.7, 8),
        new MeshPhongMaterial({ color: new Color(0.2, 0.5, 0.1) })
      );
      foliage.position.y = item.height * 0.65;
      group.add(foliage);

      return group;  // Early return for composite objects
    }

    case "landmark": {
      geometry = new BoxGeometry(15, item.height, 15);
      color = new Color(0.8, 0.6, 0.2);  // Gold
      break;
    }
  }

  const material = new MeshPhongMaterial({ color, emissive: 0x333333 });
  const mesh = new Mesh(geometry, material);

  // Position relative to block, then offset from drone
  const [itemMercX, itemMercY] = MercatorConverter.latLngToMeters(
    item.latitude, item.longitude
  );
  const [blockCenterMercX, blockCenterMercY] = MercatorConverter.latLngToMeters(
    blockCenterLat, blockCenterLng
  );
  const [droneMercX, droneMercY] = MercatorConverter.latLngToMeters(
    this.droneLat, this.droneLng
  );

  const posX = itemMercX - blockCenterMercX;
  const posZ = itemMercY - blockCenterMercY;
  const blockOffsetX = blockCenterMercX - droneMercX;
  const blockOffsetZ = blockCenterMercY - droneMercY;

  mesh.position.set(
    posX + blockOffsetX,
    item.elevation + item.height / 2,
    posZ + blockOffsetZ
  );

  return mesh;
}
```

---

## State Management: DroneContext & DroneController

### DroneContext (`src/context/DroneContext.tsx`)

**React state** for drone position and controls:

```typescript
const [drone, setDrone] = useState<DroneState>({
  latitude: 0,
  longitude: 0,
  elevation: 300,
  heading: 0,
});

const [controls, setControls] = useState<DroneControls>({
  moveForward: false,
  moveBack: false,
  moveLeft: false,
  moveRight: false,
  ascend: false,
  descend: false,
});
```

**Provides**:
- `setDroneState()`: Updates position + heading
- `setControls()`: Updates control state
- `normalizeCoordinates()`: Clamps lat/lng to valid ranges

### DroneController (`src/utils/droneController/DroneController.ts`)

**Physics simulation** (acceleration, damping, velocity limits):

```typescript
public update(controls: DroneControls, deltaTime: number): DroneState {
  // 1. Apply acceleration
  if (controls.moveForward) this.velocityNorth += acceleration * deltaTime;
  if (controls.moveRight) this.velocityEast += acceleration * deltaTime;
  if (controls.ascend) this.velocityVertical += acceleration * deltaTime;

  // 2. Apply damping (friction)
  this.velocityNorth *= 0.85;
  this.velocityEast *= 0.85;
  this.velocityVertical *= 0.9;

  // 3. Clamp velocities
  this.velocityNorth = clamp(this.velocityNorth, -30, 30);  // m/s
  this.velocityEast = clamp(this.velocityEast, -30, 30);
  this.velocityVertical = clamp(this.velocityVertical, -20, 20);

  // 4. Update position (Mercator-aware conversion)
  const metersPerDegreeAtLat = MercatorConverter.metersPerDegreeAtLatitude(
    this.droneState.latitude
  );
  const metersToDegrees = 1 / metersPerDegreeAtLat;

  const newLatitude =
    this.droneState.latitude +
    this.velocityNorth * deltaTime * metersToDegrees;
  const newLongitude =
    this.droneState.longitude +
    this.velocityEast * deltaTime * metersToDegrees;
  const newElevation =
    this.droneState.elevation +
    this.velocityVertical * deltaTime;

  // 5. Update heading based on velocity direction
  if (Math.abs(this.velocityNorth) > 0.1 || Math.abs(this.velocityEast) > 0.1) {
    this.droneState.heading =
      Math.atan2(this.velocityEast, this.velocityNorth) * (180 / Math.PI);
  }

  // 6. Update data manager for block loading
  this.dataManager.updateDronePosition(
    this.droneState.latitude,
    this.droneState.longitude
  );

  return { ...this.droneState };
}
```

---

## Complete Lifecycle: Step-by-Step Flow

### Phase 1: Initialization

```
EarthViewer.tsx useEffect([])
  ├─ Create Viewer3D (renderer, scene, camera)
  ├─ Create DataManager
  ├─ Create TerrainLayer(dataManager)
  │  └─ In makeObject(): SUBSCRIBE to dataManager.onDataChange()
  ├─ Create ContextLayer(dataManager)
  │  └─ In makeObject(): SUBSCRIBE to dataManager.onDataChange()
  ├─ Add layers to scene
  ├─ viewer.init(containerRef.current)  ← Initializes all layers
  │  └─ Calls layer.render() → layer.makeObject() → subscriptions set up
  └─ dataManager.updateDronePosition(0, 0)
     └─ FIRST DATA LOAD TRIGGERED
        ├─ getBlocksInRadius() → ["block_0_0", "block_0_1000", ...]
        ├─ loadBlocks() → MockDataGenerator.generateBlock()
        │  ├─ generateElevationData() (32x32 Perlin-like noise)
        │  └─ generateContextualItems() (seeded random items)
        ├─ emitDataChange({ type: "load", blocks: [...] })
        └─ LISTENERS CALLED:
           ├─ TerrainLayer.handleDataChange()
           │  └─ For each block: addTerrainMesh()
           │     ├─ createTerrainGeometry()
           │     ├─ Create MeshPhongMaterial (green)
           │     ├─ Create Mesh
           │     └─ Add to scene
           └─ ContextLayer.handleDataChange()
              └─ For each block: addBlockItems()
                 └─ For each item: addItemMesh()
                    ├─ createItemMesh() (box/cone/cylinder)
                    ├─ Create MeshPhongMaterial (color by type)
                    ├─ Create Mesh/Group
                    └─ Add to scene
```

### Phase 2: Update Loop

```
EarthViewer.tsx useEffect([controls])
  ├─ requestAnimationFrame(updateLoop)
  ├─ droneControllerRef.current.update(controls, deltaTime)
  │  ├─ Apply acceleration/damping
  │  ├─ Calculate new position (lat/lng/elev)
  │  ├─ dataManager.updateDronePosition(newLat, newLng)
  │  │  ├─ Check if drone moved >100m (threshold)
  │  │  ├─ Calculate blocks in 2000m radius
  │  │  ├─ loadBlocks(newBlocks)
  │  │  │  └─ emitDataChange({ type: "load" })
  │  │  │     └─ Listeners: terrainLayer.addTerrainMesh(), contextLayer.addItemMesh()
  │  │  └─ unloadBlocks(farBlocks)
  │  │     └─ emitDataChange({ type: "unload" })
  │  │        └─ Listeners: removeTerrainMesh(), removeItemMesh()
  │  └─ Return newDroneState
  ├─ terrainLayerRef.current.setDronePosition(newLat, newLng) (cache update)
  ├─ contextLayerRef.current.setDronePosition(newLat, newLng) (cache update)
  ├─ viewer.camera.updatePositionForDrone() (cockpit view follows)
  ├─ renderer.markDirty() ← Request render
  ├─ droneLayerRef.current.setDroneState(newDroneState)
  ├─ droneLayerRef.current.render() (rotate drone model)
  └─ setDroneState(...) (sync to React context)
```

### Phase 3: Rendering

```
Viewer3DRenderer
  ├─ renderer.markDirty() called
  ├─ Schedules requestAnimationFrame
  ├─ renderFrame()
  │  └─ webGLRenderer.render(scene, camera)
  │     ├─ Render terrain meshes (green)
  │     ├─ Render context items (buildings/trees/landmarks)
  │     └─ Render drone model (at world origin)
  └─ Scene ready for next frame
```

### Phase 4: Cleanup

```
EarthViewer.tsx useEffect return
  ├─ droneControllerRef.current.stop()
  ├─ dataManagerRef.current.dispose()
  │  └─ Clear cache, unsubscribe listeners
  └─ viewerRef.current.dispose()
     ├─ renderer.dispose()
     ├─ scene.dispose()
     │  └─ For each layer: layer.dispose()
     │     └─ Remove all meshes, dispose geometries/materials
     └─ camera.dispose()
```

---

## Coordinate Systems: Geographic → World → Three.js

### Three Coordinate Spaces

**Geographic (lat/lng)**:
- Drone context: `latitude: 0, longitude: 0, elevation: 300`
- Used by DroneContext, DataManager, DroneController

**Mercator Meters (world-aligned)**:
- Block position: `[blockMercX, blockMercY]`
- Offsets calculated relative to drone
- `MercatorConverter.latLngToMeters(lat, lng) → [x, y]`

**Three.js Local**:
- Drone at world origin: `(0, 0, 0)`
- Blocks/items positioned relative to drone
- Example: Block at lat=0, lng=1000m → Position: `(offsetX, 0, offsetZ)`

### Example Calculation

```
Drone at: (lat=45.5, lng=-122.5, elev=300)
Item at: (lat=45.501, lng=-122.498, elev=100)

1. Convert to Mercator:
   droneMercX, droneMercY = MercatorConverter.latLngToMeters(45.5, -122.5)
   itemMercX, itemMercY = MercatorConverter.latLngToMeters(45.501, -122.498)

2. Calculate offset from drone:
   offsetX = itemMercX - droneMercX  (e.g., ≈ 111m)
   offsetZ = itemMercY - droneMercY  (e.g., ≈ 222m)

3. In Three.js world:
   item.position.set(offsetX, itemElevation, offsetZ)
   // Item appears 111m east, 222m north of drone at ground level
```

### Heading Convention

- 0° = North (positive Y/forward)
- 90° = East (positive X/right)
- 180° = South (negative Y/back)
- 270° = West (negative X/left)

---

## Memory & Performance Optimization

### Data Loading Strategy

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Block size** | 1000m × 1000m | Spatial division |
| **Load radius** | 2000m | Preload surrounding blocks |
| **Unload distance** | 2500m | Cleanup distant blocks |
| **Movement threshold** | 100m | Debounce position updates |
| **Grid resolution** | 32×32 | Elevation detail per block |

**Result**: ~8–9 blocks loaded at any time (circular radius)

### Three.js Optimization

1. **Dirty-flag rendering**:
   - Only renders when `markDirty()` called
   - Avoids continuous redraws when scene is static
   - Massive CPU/GPU savings

2. **Geometry/material disposal**:
   - Each removed mesh disposes its geometry and material
   - Prevents memory leaks from abandoned objects

3. **Indexed geometry**:
   - Terrain uses indexed BufferGeometry (1922 triangles per block)
   - More efficient than non-indexed vertices

4. **Seeded generation**:
   - Same block ID = same procedural content
   - No storage overhead for content data
   - Deterministic across sessions

---

## Summary: Data Flow Diagram

```
DroneContext (lat/lng/elev/heading)
    ↓ (sync)
EarthViewer (useEffect)
    ├─ DroneController.update()
    │  ├─ Physics: acceleration, damping, velocities
    │  └─ dataManager.updateDronePosition()
    │     ├─ getBlocksInRadius()
    │     ├─ MockDataGenerator.generateBlock()
    │     │  ├─ perlinLike() → elevation data
    │     │  └─ generateContextualItems() → seeded items
    │     └─ emitDataChange()
    │        ├─ TerrainLayer.handleDataChange()
    │        │  └─ Viewer3DTerrainLayer.addTerrainMesh()
    │        │     ├─ createTerrainGeometry()
    │        │     ├─ MeshPhongMaterial (green)
    │        │     └─ Add to scene
    │        └─ ContextLayer.handleDataChange()
    │           └─ Viewer3DContextLayer.addItemMesh()
    │              ├─ createItemMesh() (box/cone/cylinder)
    │              ├─ MeshPhongMaterial (color by type)
    │              └─ Add to scene
    ├─ renderer.markDirty()
    └─ Viewer3DRenderer.renderFrame()
       └─ WebGLRenderer.render(scene, camera)
          ├─ Terrain meshes (32x32 grid per block)
          ├─ Context items (buildings/trees/landmarks)
          └─ Drone model (quadcopter at origin)
```

---

## Key Takeaways

1. **Event-driven architecture**: Layers don't ask for data; they listen for notifications
2. **Seeded generation**: Same coordinates always produce same content (deterministic)
3. **Memory management**: Automatic load/unload at configurable distances
4. **Coordinate transforms**: Three levels (geographic → Mercator → Three.js) keep everything coherent
5. **Dirty-flag optimization**: Only re-renders when scene changes
6. **Lifecycle discipline**: Init → operate → dispose prevents leaks and ensures stability
