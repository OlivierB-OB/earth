# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React web application that visualizes Earth with interactive 3D and map components. The app uses Three.js for 3D rendering and Leaflet for 2D mapping, allowing users to explore Earth from multiple perspectives. Components are synchronized through a shared location context, enabling interaction in one view to update the other.

## Build & Development Commands

- **Development server**: `npm start` or `npm run dev`
  - Starts webpack dev server on port 3000
  - Hot module reloading enabled
  - `npm run dev` opens browser automatically
- **Production build**: `npm run build`
  - Outputs bundled files to `dist/` directory
  - Minified and optimized for deployment
- **Type checking**: `npm run type-check`
  - Run TypeScript compiler without emitting files (single check)
  - `npm run type-watch` for continuous watch mode during development
- **Linting**: `npm run lint`
  - Check code for ESLint violations
  - `npm run lint:fix` to automatically fix linting issues
- **Code formatting**: `npm run format`
  - Format code with Prettier
  - `npm run format:check` to verify formatting without modifying files

## Project Structure & Architecture

### Component Hierarchy

```
App (LocationProvider wrapper)
├── EarthViewer        (3D Earth with Three.js)
└── Card
    └── MapCard        (2D interactive map with Leaflet)
```

### Key Components

**EarthViewer** (`src/components/EarthViewer.tsx`)
- Full-screen 3D Earth visualization using Three.js
- Features:
  - Textured sphere (NASA Blue Marble texture from CDN)
  - Mouse drag rotation in X/Y axes
  - Mouse wheel zoom (1.5 to 5 units from center)
  - Auto-rotation when idle
  - Window resize handling
  - Focus marker (red circle) that updates based on LocationContext
  - Proper cleanup on unmount (dispose geometry/materials/renderer)
- Integrates with LocationContext to display selected location as a 3D marker

**MapCard** (`src/components/mapCard/MapCard.tsx`)
- Fixed position card (bottom-right) containing interactive 2D Leaflet map
- Uses Leaflet with OpenStreetMap tiles via FlatMap utility class
- Centered at [0, 0] with zoom level 2
- Displays red circle marker at current location from LocationContext
- Implements bidirectional synchronization:
  - Map click events update the location via ClickEventHandler
  - Location changes pan the map and update the marker position
- CSS handles overflow and border radius

**Card** (`src/components/Card.tsx`)
- Reusable container component for floating UI panels
- Fixed position at bottom-right, 350x300px
- White background with shadow and rounded corners
- Wraps MapCard in the component tree

### Data Flow and State Management

**LocationContext** (`src/context/LocationContext.tsx`)
- Central state management for the focused location (latitude/longitude)
- Provides `setFocusedLocation(lat, lng)` callback that validates and normalizes coordinates:
  - Latitude clamped to [-90, 90]
  - Longitude normalized to [-180, 180]
- Both EarthViewer and MapCard subscribe to location changes via `useLocation()` hook
- Synchronization is bidirectional:
  - Clicking the 3D Earth updates the location marker and map view
  - Clicking the 2D map updates the 3D marker and camera focus
- MapCard's map click events call `setFocusedLocation()`, triggering updates in EarthViewer

### FlatMap Utility Class & Layer System

**FlatMap** (`src/utils/flatmap/FlatMap.ts`)
- Facade wrapper around Leaflet that encapsulates map lifecycle and layer management
- Implements Inversion of Control (IoC) pattern for composable layers and event handlers
- Generic layer support via `FlatMapLayer<T>` where T extends `L.Layer`
- Key methods:
  - `init(domRef)`: Initialize map with DOM container reference
  - `panTo(lat, lng)`: Pan map to location
  - `addLayer(layer)`: Add composable layer (IoC init + render)
  - `removeLayer(name)`: Remove layer and dispose resources
  - `addEventHandler(eventHandler)`: Attach event handler (IoC init + attach)
  - `removeEventHandler(name)`: Detach event handler and dispose
  - `render()`: Render all registered layers
  - `dispose()`: Clean up all resources (called on unmount)
- Exposes read-only `map` getter for direct Leaflet L.Map access

**FlatMapLayer** (`src/utils/flatmap/FlatMapLayer.ts`)
- Abstract base class for composable layers: `abstract class FlatMapLayer<T extends L.Layer>`
- Generic implementation supporting any Leaflet Layer type
- Subclasses implement `abstract renderLayer(): T`
- Key methods:
  - `init(flatMap)`: Receive parent FlatMap reference (IoC)
  - `render()`: Create and add layer to map
  - `refresh()`: Re-render if map initialized
  - `dispose()`: Cleanup resources

**BaseMapLayer** (`src/utils/flatmap/BaseMapLayer.ts`)
- Concrete layer: `extends FlatMapLayer<L.TileLayer>`
- Provides OpenStreetMap base tiles
- Returns L.tileLayer with OSM URL and proper attribution

**FlatMapMarkerLayer** (`src/components/mapCard/utils/FlatMapMarkerLayer.ts`)
- Concrete layer: `extends FlatMapLayer<L.CircleMarker>`
- Manages the red focus marker on the 2D map
- Key methods:
  - `setPosition(lat, lng)`: Update marker location
  - `setOptions(options)`: Customize marker styling (radius, color, etc.)
  - Internally calls `refresh()` on position/options changes

**FlatMapEventHandler** (`src/utils/flatmap/FlatMapEventHandler.ts`)
- Abstract base class for event handlers: `abstract class FlatMapEventHandler`
- IoC pattern: stores FlatMap reference during `init(flatMap)`
- Subclasses implement:
  - `abstract getEventType()`: Returns Leaflet event name (click, dblclick, etc.)
  - `abstract getEventCallback()`: Returns handler function
- Key methods:
  - `attach()`: Attach listener to map
  - `detach()`: Remove listener
  - `dispose()`: Cleanup resources

**ClickEventHandler** (`src/components/mapCard/utils/ClickEventHandler.ts`)
- Concrete event handler: `extends FlatMapEventHandler`
- Handles map click events
- Extracts latitude/longitude from Leaflet click event
- Calls provided callback with (lat, lng) coordinates

### TypeScript Configuration

The project uses strict TypeScript checking:
- Target: ES2020
- Strict mode enabled
- Source maps for debugging
- Declaration files generated for type information
- Based path configured for cleaner imports from `src/` directory

### Build Pipeline

- **Bundler**: Webpack 5
- **Transpiler**: Babel (ES6+ → compatible JavaScript) for `.js` files
- **TypeScript**: ts-loader for `.ts` and `.tsx` files
- **Module loaders**:
  - ts-loader for TypeScript files
  - babel-loader for JS files
  - css-loader + style-loader for CSS
- **HTML**: HtmlWebpackPlugin generates index.html from template
- **Dev Server**: webpack-dev-server with hot reload and history API fallback

### External Dependencies

- **React** (18.2.0): UI framework
- **Three.js** (0.182.0): 3D graphics library
- **Leaflet** (1.9.4): 2D mapping library
- **react-leaflet** (4.2.1): React bindings for Leaflet

### Code Quality Tools

- **ESLint** (v9): Linting with TypeScript support via @typescript-eslint
  - Configured for both JS and TS files separately
  - React and React Hooks rules enabled
  - Prettier integration to avoid formatting conflicts
- **Prettier** (v3): Code formatter with consistent style
- **TypeScript** (v5.9): Type checking and language features

### Key Styling Notes

- Global reset in `src/styles.css` removes default margins/padding
- Full viewport layout: html/body/#root are 100% width/height with overflow hidden
- System font stack for cross-platform consistency
- Inline styles used for component-specific positioning (fixed, absolute)

## Common Development Patterns

- **Refs**: useRef used extensively for DOM access (EarthViewer canvas, MapCard container, scene objects)
- **Context**: LocationContext provides shared state for map synchronization
- **Effects**: useEffect with cleanup for event listeners and resource disposal
- **Resource cleanup**: Both EarthViewer and MapCard properly clean up on unmount (critical for preventing memory leaks)
- **IoC pattern**: FlatMap uses dependency injection for layer management
- **Facade pattern**: FlatMap abstracts Leaflet complexity for MapCard component

## Recent Architecture Changes

- **TypeScript migration**: Codebase converted from JavaScript to TypeScript with strict type checking
- **FlatMap refactor**: MapCard now uses FlatMap utility class instead of managing Leaflet directly
- **Event handler system**: Added `FlatMapEventHandler` abstract base and `ClickEventHandler` for map interaction
- **Layer abstraction**: Refactored layer management with `FlatMapLayer<T>` generic base class
  - `BaseMapLayer`: OpenStreetMap tile layer
  - `FlatMapMarkerLayer`: Focus marker (replaces old MarkerLayer)
- **Component restructuring**: MapCard moved to `src/components/mapCard/` subdirectory with utils folder
- **Interface definitions**: Added TypeScript interfaces (`IFlatMap`, `IFlatMapLayer`, `IFlatMapEventHandler`)
- **Location context**: LocationContext enables bidirectional synchronization between 3D and 2D views
  - MapCard: Click events → LocationContext → EarthViewer updates
  - EarthViewer: Drag/click → LocationContext → MapCard updates
