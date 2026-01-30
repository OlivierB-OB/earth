# CLAUDE.md – Drone Flight Simulator

**Drone simulator**: React + Three.js first-person cockpit view. Procedurally generated 3D terrain/objects (seeded), keyboard-controlled (WASD/Space-Ctrl), dynamic block loading.

## Working Together Rules

- **Simplicity first**: Prefer simple solutions. KISS principle.
- **Low verbosity**: Say what matters. Avoid noise.
- **Be honest**: Tell important truths even if unwelcome. No flattery.
- **Mutual accountability**: Help avoid mistakes together.
- **Full agency**: Push back if something seems wrong. Don't just agree.
- **Flag early**: Call out unclear/risky points before they become problems.
- **Ask, don't guess**: Clarify important decisions. Don't choose randomly.
- **I don't know**: Say it instead of making things up.
- **Call out misses**: Start with ❗️ when showing errors or gaps.

## Commands

```bash
npm run dev              # Dev server + hot reload
npm run build           # Production build → dist/
npm run type-check      # TypeScript check
npm run lint[: fix]     # ESLint [auto-fix]
npm run format[:check]  # Prettier [check only]
```

## Architecture

**📖 For detailed data flow from generation → events → rendering, see [DATA_FLOW_ARCHITECTURE.md](DATA_FLOW_ARCHITECTURE.md)**

### 3D Viewer (`src/utils/3dviewer/`)
**IoC pattern**: Components receive `Viewer3D` via `init(viewer)`, not created internally.

| Component | Purpose |
|-----------|---------|
| **Viewer3D** | Main facade: `Renderer`, `Scene`, `Camera`, `EventHandler`s. Lifecycle: `init()` → use → `dispose()` |
| **Renderer** | WebGL + animation loop. Dirty-flag optimization (only render on change) |
| **Scene** | Manages layers (composable `IViewer3DSceneItem` objects) |
| **TerrainLayer** | Subscribes to DataManager `terrainLoaded`/`unloaded` events |
| **ContextLayer** | Subscribes to DataManager `contextLoaded`/`unloaded` events (buildings, trees) |
| **DroneLayer** | Renders drone model at world origin (0,0,0) |
| **Camera** | Cockpit view: 2m behind drone heading, drone altitude, FOV zoom |
| **KeyboardHandler** | WASD + Space/Ctrl → `DroneContext.controls` |
| **MouseWheelHandler** | Zoom via FOV |
| **ResizeHandler** | Viewport responsive |

### Drone Simulation (`src/utils/droneController/`, `src/context/DroneContext.tsx`)

| Component | Purpose |
|-----------|---------|
| **DroneContext** | React state: `drone` (lat/lng/elev/heading), `controls` (forward/strafe/altitude) |
| **DroneController** | Physics: acceleration, damping, speed/altitude limits, coordinate conversion |

### Data Management (`src/utils/dataManager/`)

| Component | Purpose |
|-----------|---------|
| **DataManager** | Divides world into 1000m blocks. Loads/unloads within 2000m radius. **Seeded randomization** = deterministic generation. Events: `terrainLoaded`, `contextLoaded`, `terrainUnloaded` |

### Component Tree
```
App (DroneProvider)
├── EarthViewer → Viewer3D + DataManager + DroneController + Layers + Handlers
└── MapCard (future)
```

## Key Patterns

| Pattern | Details |
|---------|---------|
| **IoC** | Components receive dependencies via `init()`, not created internally |
| **Event-Driven** | Layers subscribe to DataManager events; critical: **add layers → init() → load data** |
| **Lifecycle** | All classes: `init()` → operate → `dispose()` (prevents memory leaks) |
| **Dirty-Flag** | Renderer only re-renders on `markDirty()` call |
| **Coordinate Space** | World origin (0,0,0) = drone position. Terrain offset from drone using `CONFIG.TERRAIN.METERS_PER_DEGREE_*` |

## Critical Implementation Notes

**EarthViewer Effects Order**:
1. Initialization (no deps): Create Viewer3D, DataManager, DroneController. **Add layers to scene** → `viewer.init()` → load data
2. Update loop (deps: `controls`): `requestAnimationFrame` → drone physics → `dataManager.updateDronePosition()` → sync layers
3. Cleanup: Dispose all

**Never** add drone position to effect dependencies—triggers reinit on every frame.

**Three.js Cleanup**: Dispose geometry/material/textures, remove listeners, call `viewer.renderer.markDirty()` after scene changes.

**DataManager Events**: Block key format: `"lat_lng"` (e.g., `"0_0"`). Subscribe **before** calling `updateDronePosition()`.

**Coordinate Systems**:
- Geographic: lat/lng degrees in DroneContext
- World: Relative to drone (0,0,0). Convert using `CONFIG.TERRAIN.METERS_PER_DEGREE_*`
- Heading: 0°=N, 90°=E, 180°=S, 270°=W

## Common Tasks

**Add 3D Layer**:
1. Implement `IViewer3DSceneItem`: `init(scene)`, `render()`, `dispose()`
2. Subscribe to DataManager events in `init()`
3. Add to scene: `scene.addItem(layer)` **before** `viewer.init()`

**Add Input Handler**:
1. Extend `Viewer3DEventHandler`: `init(viewer)`, `attach()`, `dispose()`
2. Add to viewer: `viewer.addEventHandler(handler)` after `viewer.init()`

**Add Procedural Object**:
1. Add generation logic to `DataManager.generateContextData()`
2. Add mesh creation to `Viewer3DContextLayer.createObject()`
3. Update `CONFIG.PROCEDURAL_OBJECTS` parameters

## Config (`src/config.ts`)

- **CAMERA**: FOV, near/far, zoom sensitivity, drone offset
- **LIGHTING**: Ambient/directional light
- **DRONE**: Physics (speed, accel, damping), altitude limits
- **TERRAIN**: Noise params (frequency, amplitude)
- **PROCEDURAL_OBJECTS**: Building/tree/landmark sizes, colors
- **DATA_MANAGEMENT**: Block size (1000m), load radius (2000m), unload distance (2500m)
- **INTERACTION**: Zoom speed, drag threshold
- **COORDINATE_TRANSFORMS**: Geographic↔world conversion constants

*No hardcoded magic numbers—use CONFIG.*

## Testing & Debugging

**Manual**: `npm run dev`, test WASD/Space-Ctrl/wheel/resize, verify blocks load/unload.

**Quality**: `npm run type-check`, `npm run lint`, `npm run format` before commit.

**Debug Tips**: Console logs for block loading; Three.js Inspector browser extension; DevTools Performance tab; test lat/lng↔world transforms; add logs to DataManager events.

## Dependencies

React 18.2, Three.js 0.182, Leaflet 1.9.4, TypeScript 5.9, Webpack 5, ESLint, Prettier, @turf/projection
