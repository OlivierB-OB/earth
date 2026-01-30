# Drone Flight Simulator

An immersive first-person drone flight simulator built with React, Three.js, and procedurally generated 3D terrain. Fly over infinite procedurally generated landscapes with dynamic block loading.

## Features

- **First-Person Cockpit View**: Experience a realistic drone perspective 2m behind the drone heading at its altitude
- **Procedurally Generated Terrain**: Infinite seeded landscapes ensure consistent environments
- **Dynamic Block Loading**: Terrain and objects load/unload within a 2000m radius for performance optimization
- **Keyboard Flight Controls**: WASD for movement, Space/Ctrl for altitude, mouse wheel for zoom
- **Physics-Based Flight**: Acceleration, damping, speed limits, and altitude constraints for realistic flight dynamics
- **Procedural Objects**: Auto-generated buildings, trees, and landmarks integrated into the terrain

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
git clone <repository-url>
cd earth
npm install
```

### Commands

```bash
npm run dev              # Start dev server with hot reload
npm run build           # Production build → dist/
npm run type-check      # TypeScript type checking
npm run lint            # ESLint code linting
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check formatting without modifying
```

## Flight Controls

| Input | Action |
|-------|--------|
| **W** | Pitch forward (increase forward speed) |
| **S** | Pitch backward (decrease forward speed) |
| **A** | Roll left (strafe left) |
| **D** | Roll right (strafe right) |
| **Space** | Increase altitude |
| **Ctrl** | Decrease altitude |
| **Mouse Wheel** | Zoom in/out (adjusts FOV) |

## Architecture

### 3D Viewer (`src/utils/3dviewer/`)

The 3D visualization layer uses an **Inversion of Control (IoC)** pattern where components receive dependencies via `init()` methods rather than creating them internally.

| Component | Purpose |
|-----------|---------|
| **Viewer3D** | Main facade managing `Renderer`, `Scene`, `Camera`, and event handlers. Lifecycle: `init()` → use → `dispose()` |
| **Renderer** | WebGL rendering with dirty-flag optimization (only renders on changes) |
| **Scene** | Manages composable `IViewer3DSceneItem` layers |
| **TerrainLayer** | Subscribes to DataManager terrain events, renders procedural terrain |
| **ContextLayer** | Subscribes to DataManager context events, renders buildings and trees |
| **DroneLayer** | Renders drone model at world origin (0,0,0) |
| **Camera** | Cockpit view: 2m behind drone, drone altitude, zoom-adjustable FOV |
| **KeyboardHandler** | WASD + Space/Ctrl → `DroneContext.controls` |
| **MouseWheelHandler** | Zoom via FOV adjustment |
| **ResizeHandler** | Responsive viewport handling |

### Drone Simulation (`src/utils/droneController/`, `src/context/DroneContext.tsx`)

| Component | Purpose |
|-----------|---------|
| **DroneContext** | React state: position (lat/lng/elevation), heading, and control inputs |
| **DroneController** | Physics engine: acceleration, damping, speed/altitude limits, coordinate conversion |

### Data Management (`src/utils/dataManager/`)

| Component | Purpose |
|-----------|---------|
| **DataManager** | Divides the world into 1000m blocks. Loads/unloads terrain and objects within a 2000m radius. Uses seeded randomization for deterministic, repeatable terrain generation. Emits events: `terrainLoaded`, `contextLoaded`, `terrainUnloaded` |

### Component Tree

```
App (DroneProvider)
└── EarthViewer → Viewer3D + DataManager + DroneController + Layers + Handlers
```

## Key Patterns

| Pattern | Details |
|---------|---------|
| **IoC** | Components receive dependencies via `init()`, not created internally |
| **Event-Driven** | Layers subscribe to DataManager events for data synchronization |
| **Lifecycle** | All classes: `init()` → operate → `dispose()` (prevents memory leaks) |
| **Dirty-Flag Rendering** | Renderer only re-renders when `markDirty()` is called |
| **World Coordinate Space** | Origin (0,0,0) = drone position. All terrain offsets from drone. |
| **Seeded Randomization** | Same seed = same terrain generation (repeatable worlds) |

## Implementation Guide

### Effect Initialization Order (EarthViewer)

1. **Initialization** (no dependencies)
   - Create `Viewer3D`, `DataManager`, `DroneController`
   - Add layers to scene
   - Call `viewer.init()`
   - Load initial data

2. **Update Loop** (depends on `controls`)
   - `requestAnimationFrame` → drone physics
   - `dataManager.updateDronePosition()`
   - Sync layers with data changes

3. **Cleanup**
   - Dispose all resources

⚠️ **Critical**: Never add drone position to effect dependencies—it changes every frame and will cause unnecessary re-initialization.

### Adding a 3D Layer

1. Implement `IViewer3DSceneItem` interface:
   - `init(scene)`: Initialize with Three.js scene
   - `render()`: Render logic
   - `dispose()`: Cleanup

2. Subscribe to DataManager events in `init()`

3. Add to scene **before** calling `viewer.init()`:
   ```typescript
   scene.addItem(myLayer);
   viewer.init();
   ```

### Adding an Input Handler

1. Extend `Viewer3DEventHandler`:
   - `init(viewer)`: Setup
   - `attach()`: Attach event listeners
   - `dispose()`: Cleanup

2. Add to viewer:
   ```typescript
   viewer.addEventHandler(handler);
   ```

### Adding Procedural Objects

1. Add generation logic to `DataManager.generateContextData()`
2. Add mesh creation to `Viewer3DContextLayer.createObject()`
3. Update `CONFIG.PROCEDURAL_OBJECTS` parameters

## Configuration (`src/config.ts`)

All magic numbers are configurable. Key settings:

- **CAMERA**: FOV, near/far planes, zoom sensitivity, drone offset
- **LIGHTING**: Ambient and directional light
- **DRONE**: Physics (speed, acceleration, damping), altitude limits
- **TERRAIN**: Noise parameters (frequency, amplitude, scale)
- **PROCEDURAL_OBJECTS**: Building/tree/landmark sizes, colors, densities
- **DATA_MANAGEMENT**: Block size (1000m), load radius (2000m), unload distance (2500m)
- **INTERACTION**: Zoom speed, drag sensitivity
- **COORDINATE_TRANSFORMS**: Geographic ↔ world conversion constants

## Coordinate Systems

| System | Details |
|--------|---------|
| **Geographic** | Latitude/longitude degrees (stored in DroneContext) |
| **World** | Relative to drone at (0,0,0). Convert using `CONFIG.TERRAIN.METERS_PER_DEGREE_*` |
| **Heading** | 0°=North, 90°=East, 180°=South, 270°=West |

## Testing & Debugging

### Manual Testing

```bash
npm run dev
# Test: WASD flight, Space/Ctrl altitude, mouse wheel zoom, window resize
# Verify: Terrain blocks load/unload, objects render, camera stays in sync
```

### Quality Checks

```bash
npm run type-check   # Verify TypeScript
npm run lint         # Check code style
npm run format       # Format code
```

### Debug Tips

- Check browser console for block loading logs
- Use Three.js Inspector extension for scene debugging
- DevTools Performance tab for rendering profiling
- Verify lat/lng ↔ world coordinate transforms
- Add logs to DataManager events to trace data flow

## Project Structure

```
earth/
├── src/
│   ├── components/
│   │   ├── EarthViewer.tsx          # Main drone simulator component
│   │   └── ...
│   ├── context/
│   │   ├── DroneContext.tsx         # Drone state and controls
│   │   └── ...
│   ├── utils/
│   │   ├── 3dviewer/                # 3D rendering system
│   │   │   ├── Viewer3D.ts
│   │   │   ├── Viewer3DRenderer.ts
│   │   │   ├── Viewer3DScene.ts
│   │   │   ├── Viewer3DCamera.ts
│   │   │   ├── Viewer3DTerrainLayer.ts
│   │   │   ├── Viewer3DContextLayer.ts
│   │   │   ├── Viewer3DDroneLayer.ts
│   │   │   └── ...
│   │   ├── droneController/         # Flight physics
│   │   │   └── DroneController.ts
│   │   ├── dataManager/             # Block loading and terrain gen
│   │   │   └── DataManager.ts
│   │   └── ...
│   ├── config.ts                    # Configuration constants
│   ├── App.tsx                      # Root component
│   ├── index.tsx                    # Entry point
│   └── styles.css                   # Global styles
├── dist/                            # Production build output
├── package.json
├── tsconfig.json
├── webpack.config.js
├── .prettierrc
├── eslint.config.js
└── README.md
```

## Technologies

- **React** 18.2: UI framework and state management
- **Three.js** 0.182: 3D graphics rendering
- **TypeScript** 5.9: Type-safe development
- **Webpack** 5: Module bundling
- **ESLint** 9: Code quality
- **Prettier** 3: Code formatting
- **Turf.js**: Geographic utilities (projection)

## Code Quality Standards

- **TypeScript**: Strict mode with full type checking
- **ESLint**: Enforced code style and patterns
- **Prettier**: Consistent code formatting
- **Pre-commit**: Type checking and linting before commits

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please ensure:
- Code passes `npm run type-check` and `npm run lint`
- Follow the IoC and event-driven patterns
- Properly implement lifecycle methods (`init()` and `dispose()`)
- Test terrain loading, flight controls, and memory cleanup
