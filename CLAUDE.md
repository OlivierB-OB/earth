# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server with hot reload (opens browser)
npm run dev
# or
npm start

# Production build (output to dist/)
npm run build

# Code quality checks
npm run type-check        # Run TypeScript type checker
npm run type-watch        # Watch mode for TypeScript
npm run lint              # Check code with ESLint
npm run lint:fix          # Fix ESLint issues automatically
npm run format            # Format code with Prettier
npm run format:check      # Check formatting without modifying
```

## Project Overview

This is an interactive Earth visualization web application built with React, Three.js (3D globe), and Leaflet (2D map). The core feature is synchronized interaction between a full-screen 3D globe and a floating 2D map panel—clicking on one view updates the other.

## High-Level Architecture

The application uses **two main visualization systems** that share state through React Context:

### 1. **3D Viewer (Viewer3D)** - `src/utils/3dviewer/`

A Three.js facade with a **component-based, composable architecture** using the **IoC (Inversion of Control)** pattern:

- **Viewer3D** (`Viewer3D.ts`): Main facade managing lifecycle
  - Owns three core components: `Renderer`, `Scene`, `Camera`
  - Manages a set of `EventHandler`s for interaction (mouse, wheel, etc.)
  - Follows init → attach → dispose lifecycle

- **Renderer** (`IViewer3DRenderer`): WebGL context and animation loop
- **Scene** (`IViewer3DScene`): Manages 3D objects (layers/items)
  - Implemented as a composition of layers (e.g., `Viewer3DEarthLayer`, `Viewer3DMarkerLayer`)
  - Uses `IViewer3DSceneItem` interface for individual 3D objects

- **Camera** (`IViewer3DCamera`): Perspective camera for 3D view

- **Event Handlers** (`Viewer3DEventHandler`): Pluggable handlers for user interaction
  - Mouse rotation, zoom (wheel), auto-rotation
  - Each handler: `init(viewer)` → `attach()` → `dispose()`

**Key Pattern**: All components receive the `Viewer3D` instance via `init()` method (IoC injection), allowing them to access renderer, scene, camera without circular dependencies.

### 2. **FlatMap (2D Leaflet)** - `src/utils/flatmap/`

Similar composable architecture for Leaflet:

- **FlatMap** (`FlatMap.ts`): Facade managing the Leaflet `L.Map` instance
  - Owns layers (composable via `IFlatMapLayer`)
  - Owns event handlers (composable via `IFlatMapEventHandler`)
  - Lifecycle: init → render → dispose

- **Layers**: `FlatMapLayer`, `FlatMapMarkerLayer`, base class `BaseMapLayer`
- **Event Handlers**: Pluggable click handlers

### 3. **Shared State** - React Context

- **LocationContext** (`src/context/LocationContext.tsx`): Single source of truth
  - Stores `location: { latitude, longitude }`
  - Normalizes coordinates (latitude [-90, 90], longitude [-180, 180])
  - Consumed by both EarthViewer and MapCard components via `useLocation()` hook

### 4. **Component Structure**

```
App (wraps with LocationProvider)
├── EarthViewer         # React component using Viewer3D
│   └── Creates/manages Viewer3D instance in effect
├── Card (reusable floating UI container)
│   └── MapCard         # React component using FlatMap
│       └── Creates/manages FlatMap instance in effect
```

## Key Architectural Patterns

### **Dependency Injection / IoC Pattern**

Components don't create their dependencies; they receive them:
- `Viewer3D` constructor accepts `renderer`, `scene`, `camera` (defaulted to new instances)
- When initializing, `init(domRef)` passes `this` to child components
- Event handlers receive the viewer via `init(viewer)` call

**Benefit**: Easy testing and composition without tight coupling.

### **Lifecycle Management**

All major classes follow: `init()` → operation → `dispose()`

- `init()`: Connect to DOM, initialize resources
- `dispose()`: Clean up event listeners, Three.js/Leaflet objects, memory

This prevents memory leaks when components unmount (critical for long-running 3D apps).

### **Composable Layers**

Both Viewer3D and FlatMap use a layer pattern:
- Layers implement interfaces (`IViewer3DSceneItem`, `IFlatMapLayer`)
- Each layer is independent and can be added/removed dynamically
- Layers are initialized with the parent (viewer or flatmap) via IoC

## Important Implementation Notes

1. **Coordinate Systems**
   - LocationContext normalizes all coordinates
   - When updating from 3D click, convert 3D world position → geographic lat/lon
   - When updating from 2D click, Leaflet already uses lat/lon

2. **React Effects**
   - EarthViewer and MapCard use `useEffect` to create/dispose their instances
   - Disposal on unmount is critical to prevent memory leaks
   - Dependency arrays should include what's needed to rebuild (usually just location)

3. **Three.js Cleanup**
   - Dispose geometries, materials, textures, renderer
   - Remove event listeners before disposal
   - Don't leave dangling references to WebGL resources

4. **Leaflet Map Quirks**
   - Map must be attached to a DOM element with a size
   - `L.map().remove()` fully cleans up the instance
   - Layer order matters for rendering

## Testing Approach

- Currently no automated test suite (type-check and lint are quality gates)
- Test changes by running `npm run dev` and manually verifying both views stay synchronized
- Check console for TypeScript or lint errors before committing

## Common Tasks

**Adding a 3D Element**:
1. Create a class implementing `IViewer3DSceneItem`
2. Add to `Viewer3DScene` or create a new layer class
3. Implement `init()` to set up Three.js objects
4. Implement `dispose()` to clean up

**Adding Interaction to 3D**:
1. Create `Viewer3DEventHandler` subclass
2. Implement `init(viewer)`, `attach()`, `dispose()`
3. Add to viewer via `viewer.addEventHandler()`

**Adding a 2D Layer**:
1. Create class implementing `IFlatMapLayer` (or extend `BaseMapLayer`)
2. Implement `init(flatmap)`, `render()`, `dispose()`
3. Add to map via `flatmap.addLayer()`

## Dependencies

- **React 18.2.0**: UI framework
- **Three.js 0.182.0**: 3D graphics (WebGL)
- **Leaflet 1.9.4**: 2D mapping
- **TypeScript 5.9**: Strict type checking
- **Webpack 5**: Module bundling
- **ESLint + Prettier**: Code quality
